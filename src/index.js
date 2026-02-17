import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  parse,
  detect,
  moderate,
  analyzeSentiment,
  extractEntities,
  extractTopics,
  transform
} from './api.js';

const program = new Command();

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }
  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });
  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));
  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });
  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Tisane API key not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  tisane config set --api-key <key>'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('tisane')
  .description(chalk.bold('Tisane CLI') + ' - NLP & content moderation from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'Tisane API subscription key')
  .action((options) => {
    if (options.apiKey) { setConfig('apiKey', options.apiKey); printSuccess('API key set'); }
    if (!options.apiKey) {
      printError('No options provided. Use --api-key');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    console.log(chalk.bold('\nTisane CLI Configuration\n'));
    console.log('API Key: ', apiKey ? chalk.green('*'.repeat(8) + apiKey.slice(-4)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// PARSE (full NLP analysis)
// ============================================================

const parseCmd = program.command('parse').description('Full NLP analysis of text');

parseCmd
  .command('text')
  .description('Parse and analyze text with full NLP pipeline')
  .requiredOption('--text <text>', 'Text to analyze')
  .option('--language <lang>', 'Language code (e.g. en, fr, de)', 'en')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Analyzing text...', () =>
        parse({ text: options.text, language: options.language })
      );
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nNLP Analysis\n'));
      if (result.sentiment !== null && result.sentiment !== undefined) {
        const s = result.sentiment;
        const color = s > 0 ? chalk.green : s < 0 ? chalk.red : chalk.yellow;
        console.log('Sentiment:  ', color(s > 0 ? `+${s}` : String(s)));
      }
      if (result.entities && result.entities.length > 0) {
        console.log(chalk.bold('\nEntities:'));
        printTable(result.entities, [
          { key: 'type', label: 'Type', format: (v) => v || 'N/A' },
          { key: 'text', label: 'Text', format: (v) => v || 'N/A' },
          { key: 'ref', label: 'Reference', format: (v) => v || 'N/A' }
        ]);
      }
      if (result.topics && result.topics.length > 0) {
        console.log(chalk.bold('\nTopics:'));
        result.topics.forEach(t => console.log(`  - ${t.topic || t}`));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

parseCmd
  .command('detect')
  .description('Detect the language of text')
  .requiredOption('--text <text>', 'Text for language detection')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Detecting language...', () => detect({ text: options.text }));
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nLanguage Detection\n'));
      console.log('Detected Language: ', chalk.cyan(result.language || result.detected || JSON.stringify(result)));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// MODERATION
// ============================================================

const moderationCmd = program.command('moderation').description('Content moderation and abuse detection');

moderationCmd
  .command('check')
  .description('Check text for abusive content, hate speech, and policy violations')
  .requiredOption('--text <text>', 'Text to moderate')
  .option('--language <lang>', 'Language code', 'en')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Moderating content...', () =>
        moderate({ text: options.text, language: options.language })
      );
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nContent Moderation Report\n'));
      const hasIssues = (result.abuse && result.abuse.length > 0) || (result.bigotry && result.bigotry.length > 0);
      if (!hasIssues) {
        printSuccess('No content violations detected');
      } else {
        if (result.abuse && result.abuse.length > 0) {
          console.log(chalk.red('\nAbuse detected:'));
          result.abuse.forEach(a => console.log(`  - [${a.type || 'abuse'}] ${a.text || JSON.stringify(a)}`));
        }
        if (result.bigotry && result.bigotry.length > 0) {
          console.log(chalk.red('\nBigotry detected:'));
          result.bigotry.forEach(b => console.log(`  - [${b.type || 'bigotry'}] ${b.text || JSON.stringify(b)}`));
        }
      }
      if (result.sentiment !== null && result.sentiment !== undefined) {
        console.log('\nSentiment: ', result.sentiment);
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// SENTIMENT
// ============================================================

const sentimentCmd = program.command('sentiment').description('Sentiment analysis');

sentimentCmd
  .command('analyze')
  .description('Analyze sentiment of text')
  .requiredOption('--text <text>', 'Text to analyze')
  .option('--language <lang>', 'Language code', 'en')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Analyzing sentiment...', () =>
        analyzeSentiment({ text: options.text, language: options.language })
      );
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nSentiment Analysis\n'));
      if (result.sentiment !== null && result.sentiment !== undefined) {
        const s = result.sentiment;
        const label = s > 0.3 ? 'Positive' : s < -0.3 ? 'Negative' : 'Neutral';
        const color = s > 0.3 ? chalk.green : s < -0.3 ? chalk.red : chalk.yellow;
        console.log('Sentiment Score:  ', color(`${s > 0 ? '+' : ''}${s}`));
        console.log('Sentiment Label:  ', color(label));
      } else {
        console.log('Sentiment: ', chalk.yellow('Not detected'));
      }
      if (result.topics && result.topics.length > 0) {
        console.log('\nTopics:');
        result.topics.forEach(t => console.log(`  - ${t.topic || t}`));
      }
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// ENTITIES
// ============================================================

const entitiesCmd = program.command('entities').description('Entity extraction and topic detection');

entitiesCmd
  .command('extract')
  .description('Extract named entities from text')
  .requiredOption('--text <text>', 'Text to analyze')
  .option('--language <lang>', 'Language code', 'en')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const entities = await withSpinner('Extracting entities...', () =>
        extractEntities({ text: options.text, language: options.language })
      );
      if (options.json) { printJson(entities); return; }
      if (!entities || entities.length === 0) {
        console.log(chalk.yellow('No entities found.'));
        return;
      }
      console.log(chalk.bold('\nExtracted Entities\n'));
      printTable(entities, [
        { key: 'type', label: 'Type', format: (v) => v || 'N/A' },
        { key: 'text', label: 'Text', format: (v) => v || 'N/A' },
        { key: 'ref', label: 'Reference', format: (v) => v || 'N/A' },
        { key: 'sentiment', label: 'Sentiment', format: (v) => v !== undefined ? String(v) : 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

entitiesCmd
  .command('topics')
  .description('Extract topics from text')
  .requiredOption('--text <text>', 'Text to analyze')
  .option('--language <lang>', 'Language code', 'en')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const topics = await withSpinner('Extracting topics...', () =>
        extractTopics({ text: options.text, language: options.language })
      );
      if (options.json) { printJson(topics); return; }
      if (!topics || topics.length === 0) {
        console.log(chalk.yellow('No topics found.'));
        return;
      }
      console.log(chalk.bold('\nExtracted Topics\n'));
      topics.forEach((t, i) => console.log(`  ${i + 1}. ${t.topic || JSON.stringify(t)}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// TRANSFORM
// ============================================================

const transformCmd = program.command('transform').description('Text transformation and grammar correction');

transformCmd
  .command('fix')
  .description('Fix spelling and grammar in text')
  .requiredOption('--text <text>', 'Text to transform')
  .option('--language <lang>', 'Language code', 'en')
  .option('--type <type>', 'Transformation type', 'spelling_and_grammar')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const result = await withSpinner('Transforming text...', () =>
        transform({ text: options.text, language: options.language, transformationType: options.type })
      );
      if (options.json) { printJson(result); return; }
      console.log(chalk.bold('\nTransformed Text\n'));
      console.log('Original:    ', chalk.dim(options.text));
      console.log('Transformed: ', chalk.green(result.text || result.result || JSON.stringify(result)));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
