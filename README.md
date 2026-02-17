> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Tisane CLI

A production-ready command-line interface for the [Tisane](https://tisane.ai) NLP and content moderation API. Analyze text, detect language, moderate content, extract entities, and analyze sentiment directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by Tisane Labs.

## Features

- **Parse** — Full NLP analysis pipeline with entity and topic extraction
- **Moderation** — Detect abuse, hate speech, and policy violations
- **Sentiment** — Analyze sentiment scores and labels
- **Entities** — Extract named entities (people, places, organizations)
- **Transform** — Grammar correction and text transformation
- **JSON output** — All commands support `--json` for scripting and piping
- **Colorized output** — Clean, readable terminal output with chalk

## Why CLI > MCP

MCP servers are complex, stateful, and require a running server process. A CLI is:

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe output to `jq`, `grep`, `awk`, and other tools
- **Scriptable** — Use in shell scripts, CI/CD pipelines, cron jobs
- **Debuggable** — See exactly what's happening with `--json` flag
- **AI-friendly** — AI agents can call CLIs just as easily as MCPs, with less overhead

## Installation

```bash
npm install -g @ktmcp-cli/tisane
```

## Authentication Setup

Get your API key from the [Tisane developer portal](https://dev.tisane.ai).

### Configure the CLI

```bash
tisane config set --api-key YOUR_API_KEY
```

## Commands

### Configuration

```bash
tisane config set --api-key <key>
tisane config show
```

### Parse (Full NLP Analysis)

```bash
# Full NLP analysis
tisane parse text --text "Apple is looking at buying U.K. startup for $1 billion"

# With specific language
tisane parse text --text "Bonjour le monde" --language fr

# Detect language
tisane parse detect --text "こんにちは世界"
```

### Content Moderation

```bash
# Check for abusive content
tisane moderation check --text "Some text to moderate"

# With language specification
tisane moderation check --text "Texto para moderar" --language es
```

### Sentiment Analysis

```bash
# Analyze sentiment
tisane sentiment analyze --text "I love this product, it's amazing!"
tisane sentiment analyze --text "This is terrible, never buying again." --language en
```

### Entity Extraction

```bash
# Extract named entities
tisane entities extract --text "Elon Musk founded SpaceX in 2002 in Hawthorne, California"

# Extract topics
tisane entities topics --text "The Federal Reserve raised interest rates amid inflation concerns"
```

### Text Transformation

```bash
# Fix spelling and grammar
tisane transform fix --text "Ths sentance has sum errers in it"

# With language
tisane transform fix --text "Il y a des erreurs" --language fr
```

## JSON Output

All commands support `--json` for machine-readable output:

```bash
# Get full analysis as JSON
tisane parse text --text "Hello world" --json

# Extract only entities
tisane entities extract --text "..." --json | jq '.[] | {type, text}'

# Get sentiment score
tisane sentiment analyze --text "..." --json | jq '.sentiment'
```

## Examples

### Content moderation pipeline

```bash
# Read text from file and moderate
cat user_comment.txt | xargs -I{} tisane moderation check --text "{}"

# Batch moderate with jq
echo '["Hello", "Hate message here"]' | jq -r '.[]' | while read line; do
  tisane moderation check --text "$line" --json
done
```

### Entity extraction workflow

```bash
# Extract all person entities
tisane entities extract --text "..." --json | jq '.[] | select(.type == "Person") | .text'
```

## Contributing

Issues and pull requests are welcome at [github.com/ktmcp-cli/tisane](https://github.com/ktmcp-cli/tisane).

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.
