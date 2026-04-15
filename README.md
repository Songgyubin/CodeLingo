# CodeLingo

Claude Code slash commands for understanding unfamiliar code — quickly and safely.

Three commands. Drop them into any project. Works with Claude Code's native `/` command system.

---

## Commands

### `/explain-file <path>`
Explains a source file at your skill level and saves the result to `.codelingo/`.

- Asks your familiarity with the language (beginner / familiar / expert) and calibrates depth
- Saves explanation to `.codelingo/<filename>.md`
- Optionally adds comments directly to the source file:
  - **A** — TL;DR header block at the top
  - **B** — Function/class-level comments throughout
  - **C** — Inline comments on every non-obvious line

### `/change-impact <path> ["proposed change"]`
Analyzes the blast radius of a proposed change before you make it.

- Shows which functions/lines are directly affected (with line numbers)
- Infers likely callers with explicit confidence: `probably / possibly / unknown`
- Flags dynamic patterns (event emitters, DI, dynamic imports) that limit static analysis
- Produces Before/After checklists
- Saves to `.codelingo/change-impact-<filename>.md`

### `/handoff <path>`
Generates a structured handoff document for any source file.

- Asks who will read it (same-team dev / external dev / non-developer) and calibrates depth
- Covers: module purpose, architecture glossary, key decisions + WHY, dependency map, how to make common changes, known gotchas
- Optionally injects a TL;DR comment at the top of the source file
- Saves to `.codelingo/HANDOFF-<filename>.md`

---

## Install

**Via npm (recommended):**

```bash
npm install -g codelingo
codelingo install
```

**Manual (copy 3 files):**

```bash
mkdir -p ~/.claude/commands
curl -o ~/.claude/commands/explain-file.md   https://raw.githubusercontent.com/songgyubin/CodeLingo/main/commands/explain-file.md
curl -o ~/.claude/commands/change-impact.md  https://raw.githubusercontent.com/songgyubin/CodeLingo/main/commands/change-impact.md
curl -o ~/.claude/commands/handoff.md        https://raw.githubusercontent.com/songgyubin/CodeLingo/main/commands/handoff.md
```

That's it. The commands are immediately available in any Claude Code session.

---

## Usage

```
/explain-file src/utils/scheduler.py
/change-impact src/utils/scheduler.py "I want to add a retry limit parameter"
/handoff src/auth/middleware.ts
```

### Persistent config

First run saves your language preference and skill level to `.codelingo/config.json`. Subsequent runs skip those questions.

To reset skill level: delete the `skillLevel` field from `.codelingo/config.json`.

---

## CLI reference

```
codelingo install      Copy commands to ~/.claude/commands/
codelingo uninstall   Remove commands from ~/.claude/commands/
codelingo list        Show which commands are installed
```

---

## Requirements

- [Claude Code](https://claude.ai/code) (any plan)
- An Anthropic API key configured in Claude Code
- Node.js 16+ (for the npm installer only)
