# CodeLingo

[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

Claude Code slash commands for understanding unfamiliar code, quickly and safely.

Instead of throwing a raw prompt at an AI every time you open a new file, CodeLingo gives you three focused commands for three common situations: understand the file, predict the impact of a change, and hand the file off to someone else.

## Who This Is For

- Developers reading an unfamiliar repository for the first time
- People working on AI-generated or vibe-coded code they did not fully author
- Teams that need lightweight documentation without building a full internal docs system

## Quick Start

1. Install the package.
2. Copy the slash commands into Claude Code.
3. Run one command on a real file.

```bash
npm install -g codelingo
codelingo install
```

Then in Claude Code:

```text
/explain-file src/utils/scheduler.py
```

If it clicks in the first few minutes, the rest of the workflow will make sense immediately.

## What Each Command Does

| Command | Use it when | Output |
|---------|-------------|--------|
| `/explain-file <path>` | You need to understand a file before touching it | `.codelingo/<filename>.md` |
| `/change-impact <path> ["proposed change"]` | You want to estimate blast radius before editing | `.codelingo/change-impact-<filename>.md` |
| `/handoff <path>` | You need a structured handoff for another reader | `.codelingo/HANDOFF-<filename>.md` |

### `/explain-file <path>`

Explains a source file at your skill level and saves the result beside your work.

What it does:
- Asks how familiar you are with the language: beginner, familiar, or expert
- Adjusts depth based on that answer instead of giving the same explanation to everyone
- Includes line references, control flow, dependencies, gotchas, and what to read next
- Can optionally inject comments back into the source file

Good example:

```text
/explain-file src/services/billing/retry_policy.ts
```

### `/change-impact <path> ["proposed change"]`

Analyzes what is likely to break or need updates before you change the file.

What it does:
- Summarizes the file's role first, so the impact analysis has context
- Identifies directly affected functions, classes, constants, and lines
- Infers likely callers with explicit confidence: `probably`, `possibly`, `unknown`
- Produces before/after checklists so you can make the change more safely

Good example:

```text
/change-impact src/services/billing/retry_policy.ts "Add a maximum backoff cap"
```

### `/handoff <path>`

Generates a handoff document that is actually usable by the next reader.

What it does:
- Asks who the audience is: same-team developer, external developer, or non-developer
- Adjusts depth and jargon to that audience
- Covers module purpose, key decisions, dependency map, common changes, and known gotchas
- Can optionally inject a TL;DR comment block into the source file

Good example:

```text
/handoff src/services/billing/retry_policy.ts
```

## Install

### Option 1: npm install

```bash
npm install -g codelingo
codelingo install
```

This copies the three Markdown slash-command files into `~/.claude/commands/`.

### Option 2: Manual install

If you do not want the npm package, copy the command files directly:

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

After installation, the commands are available in any Claude Code session.

## How It Works In Practice

### First run

On first use, CodeLingo stores preferences in `.codelingo/config.json`.

- `language`: `en`, `ko`, `ja`, or `zh`
- `skillLevel`: `beginner`, `familiar`, or `expert` for `/explain-file`

That means later runs skip the same setup questions.

To reset your explanation depth, delete the `skillLevel` field from `.codelingo/config.json`.

### Generated files

CodeLingo writes output into a local `.codelingo/` directory in your project.

- `/explain-file src/utils/job_scheduler.py`
  writes `.codelingo/job_scheduler.md`
- `/change-impact src/utils/job_scheduler.py "..."`
  writes `.codelingo/change-impact-job_scheduler.md`
- `/handoff src/utils/job_scheduler.py`
  writes `.codelingo/HANDOFF-job_scheduler.md`

This keeps the output close to the code instead of hiding it in a chat transcript.

### Comment injection

Two commands can optionally modify the source file:

- `/explain-file`: add a TL;DR block, function/class comments, or line comments
- `/handoff`: add a TL;DR block that points to the handoff document

The command instructions include idempotency rules so existing CodeLingo blocks get replaced instead of duplicated.

## Usage Examples

### Understand a file before editing

```text
/explain-file src/auth/middleware.ts
```

Use this when you have opened a file and do not trust yourself to edit it yet.

### Estimate risk before a refactor

```text
/change-impact src/auth/middleware.ts "Split token parsing from permission checks"
```

Use this when the change sounds small but probably is not.

### Create a handoff for another person

```text
/handoff src/auth/middleware.ts
```

Use this when a teammate, contractor, or PM needs a compact explanation with context.

## CLI Reference

```text
codelingo install      Copy slash commands to ~/.claude/commands/
codelingo uninstall    Remove slash commands from ~/.claude/commands/
codelingo list         Show which commands are installed
codelingo help         Show help
```

## Requirements

- [Claude Code](https://claude.ai/code)
- An Anthropic API key configured in Claude Code
- Node.js 16+ for the npm installer

## Limits And Expectations

- This is prompt-driven workflow, not AST-backed static analysis
- Caller inference in `/change-impact` is intentionally explicit about confidence
- Generated or noisy files are supposed to be rejected rather than over-explained

If you want structured code understanding inside Claude Code without building a full docs pipeline, this is the point of the project.
