# CodeLingo

Agent-based code understanding workflows for unfamiliar code.

CodeLingo helps you inspect a file, estimate the impact of a change, and generate a handoff document. You can use it as Claude Code slash commands or as a lightweight agent harness that prepares provider-ready prompts.

**Choose your language:**
[한국어](README.ko.md) · [English](README.en.md) · [日本語](README.ja.md) · [中文](README.zh-CN.md)

## Why CodeLingo

- You opened a file you do not trust yet
- You want to understand blast radius before changing it
- You need a handoff document without writing one from scratch

CodeLingo packages those three workflows as reusable tasks instead of making you reinvent prompts every time.

## What You Get

- `/explain-file` to explain an unfamiliar file at your skill level
- `/change-impact` to estimate blast radius before editing code
- `/handoff` to generate a structured handoff document for the next reader

## Install

```bash
npm install -g @gyub.s/codelingo
```

## Usage Option 1: Claude Code Slash Commands

Install the slash commands:

```bash
codelingo install
```

`codelingo install` copies the slash-command Markdown files into `~/.claude/commands/`.

Open Claude Code and run one of these:

```text
/explain-file src/utils/scheduler.py
/change-impact src/utils/scheduler.py "Add a retry limit parameter"
/handoff src/auth/middleware.ts
```

The commands write results into `.codelingo/`:

```text
.codelingo/scheduler.md
.codelingo/change-impact-scheduler.md
.codelingo/HANDOFF-middleware.md
```

## Usage Option 2: Agent Harness

Use the harness when you want CodeLingo to compose role-specific agent prompts outside Claude Code slash commands:

```bash
codelingo agents
codelingo tasks
codelingo run explain-file src/utils/scheduler.py --language ko --skill familiar
codelingo run change-impact src/utils/scheduler.py --change "Add a retry limit"
codelingo run handoff src/auth/middleware.ts --audience "external developer"
```

`codelingo run` does not call a model directly. It applies the file guard, reads the target file, composes the task's agent pipeline, and writes a provider-ready prompt under `.codelingo/runs/`.

Each generated run prompt includes:

- the source file content
- the selected task
- the agent pipeline
- the expected final output path under `.codelingo/`

## Manage Your Install

```text
codelingo list
codelingo agents
codelingo tasks
codelingo help
codelingo uninstall
```

## Agent Pipelines

Agents live in `agents/*.md`, so each role prompt is editable as a plain Markdown file. Current pipelines:

```text
explain-file   source-cartographer -> explainer -> risk-reviewer -> output-editor
change-impact  source-cartographer -> impact-analyst -> risk-reviewer -> output-editor
handoff        source-cartographer -> handoff-writer -> risk-reviewer -> output-editor
```

## What Each Command Produces

| Command | Use it when | Output |
|---------|-------------|--------|
| `/explain-file <path>` | You need to understand a file before touching it | `.codelingo/<filename>.md` |
| `/change-impact <path> ["proposed change"]` | You want to estimate blast radius before editing | `.codelingo/change-impact-<filename>.md` |
| `/handoff <path>` | You need a structured handoff for another reader | `.codelingo/HANDOFF-<filename>.md` |

## Install Notes

If you do not want the npm package, you can also install manually:

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/Songgyubin/CodeLingo/main/commands/handoff.md
```

## Requirements

- [Claude Code](https://claude.ai/code)
- An Anthropic API key configured in Claude Code
- Node.js 16+ for the npm installer

## Release Automation

This repository includes GitHub Actions publishing via `.github/workflows/publish.yml`.

- Push a tag like `v0.1.1`
- GitHub Actions runs a smoke test and `npm pack --dry-run`
- npm publish happens through trusted publishing, without storing a long-lived npm token in GitHub

To enable this on npm:

1. Publish the package once manually so the package page exists on npm.
2. In npm package settings, open `Trusted publishing`.
3. Add a GitHub Actions trusted publisher for:
   - GitHub user or org: `Songgyubin`
   - Repository: `CodeLingo`
   - Workflow filename: `publish.yml`
4. After trusted publishing works, change package publishing access to disallow traditional tokens.

For full installation, examples, and usage details in your preferred language, open one of the language-specific READMEs above.
