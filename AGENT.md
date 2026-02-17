# AGENT.md — Tisane CLI for AI Agents

This document explains how to use the Tisane CLI as an AI agent.

## Overview

The `tisane` CLI provides access to the Tisane NLP and content moderation API. Use it to analyze text, detect abuse, extract entities, and analyze sentiment.

## Prerequisites

Configure with an API key:

```bash
tisane config set --api-key <key>
tisane config show
```

## All Commands

### Config

```bash
tisane config set --api-key <key>
tisane config show
```

### Parse

```bash
tisane parse text --text "Text to analyze"
tisane parse text --text "Texte francais" --language fr
tisane parse detect --text "Text in unknown language"
```

### Moderation

```bash
tisane moderation check --text "Content to moderate"
tisane moderation check --text "Content" --language en
```

### Sentiment

```bash
tisane sentiment analyze --text "I love this!"
tisane sentiment analyze --text "This is terrible." --language en
```

### Entities

```bash
tisane entities extract --text "Apple CEO Tim Cook announced..."
tisane entities topics --text "Federal Reserve raises interest rates..."
```

### Transform

```bash
tisane transform fix --text "Ths has speeling errers"
tisane transform fix --text "Text" --language en --type spelling_and_grammar
```

## JSON Output

Use `--json` for structured output:

```bash
tisane parse text --text "..." --json
tisane moderation check --text "..." --json
tisane sentiment analyze --text "..." --json
tisane entities extract --text "..." --json
```

## Language Codes

Common: `en` (English), `fr` (French), `de` (German), `es` (Spanish), `it` (Italian), `pt` (Portuguese), `ru` (Russian), `ar` (Arabic), `zh` (Chinese), `ja` (Japanese)

## Sentiment Scale

- Positive: > 0.3
- Neutral: -0.3 to 0.3
- Negative: < -0.3

## Error Handling

The CLI exits with code 1 on error. Common errors:
- `Authentication failed` — Check API key / subscription
- `Rate limit exceeded` — Wait and retry
