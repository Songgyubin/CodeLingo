# CodeLingo Phase 2 — VS Code Extension Spec

**What this doc is:** A concrete build spec for the Phase 2 VS Code extension.
**What it fixes:** The Phase 1 failure root cause — explanation was separated from the code.
**What Phase 1 proved:** The explanation quality works (5/5 reduced time-to-understanding). The delivery mechanism didn't.

---

## The One Insight

Sidebar panel = explanation stays visible while you edit. No context switch.
That's the entire product improvement from Phase 1 → Phase 2.

---

## User Story

> "I open a file I vibe-coded 3 weeks ago. The sidebar immediately shows me what it does, what can break, and where to start reading — while I'm looking at the code."

---

## Extension Structure

```
codelingo-vscode/
  src/
    extension.ts        ← entry point: registers sidebar + commands
    sidebar.ts          ← WebviewViewProvider: renders the panel HTML
    explainer.ts        ← core: reads file → builds prompt → streams Claude API
    fileWatcher.ts      ← listens to activeTextEditor changes, triggers explain
    apiKeyManager.ts    ← SecretStorage wrapper for API key
    prompt.ts           ← explain-file prompt (ported directly from Phase 1)
    fileGuard.ts        ← detect generated/minified/binary files
  webview/
    panel.html          ← sidebar HTML template
    panel.css           ← sidebar styles
    panel.js            ← receives streamed tokens, updates DOM
  package.json          ← extension manifest
  tsconfig.json
  webpack.config.js     ← bundles src/ for VS Code
```

---

## Sidebar Panel UI

```
┌─────────────────────────────────┐
│ CodeLingo              [↻] [⚙] │
├─────────────────────────────────┤
│ DebouncedSearchPanel.tsx        │
├─────────────────────────────────┤
│ TL;DR                           │
│                                 │
│ Purpose: A search input that    │
│   debounces API calls by 300ms  │
│   to avoid hammering the server │
│                                 │
│ Entry points: DebouncedSearch-  │
│   Panel (default export)        │
│                                 │
│ Watch out: Query state is       │
│   managed by ref + timeout ID—  │
│   direct edits to inputRef lose │
│   pending debounce              │
├─────────────────────────────────┤
│ ▸ Role                          │
│ ▸ Inputs / Outputs              │
│ ▸ Control Flow                  │
│ ▸ Dependencies                  │
│ ▸ Gotchas                       │
│ ▸ What to read next             │
├─────────────────────────────────┤
│ Confidence: Medium              │
│ Missing: API response type      │
└─────────────────────────────────┘
```

**Interaction rules:**
- TL;DR section always starts open.
- Full sections start collapsed. User expands what they need.
- `[↻]` = re-run analysis for current file.
- `[⚙]` = settings (API key, auto-trigger toggle).
- Streaming: tokens appear in real time — TL;DR renders first as tokens arrive.

---

## Data Flow

```
User opens file
  │
  ▼
fileWatcher.ts
  onDidChangeActiveTextEditor()
  debounce 500ms
  │
  ▼
fileGuard.ts
  Is it generated / minified / binary / node_modules?
  ├── YES → show: "Auto-generated file — no explanation"
  └── NO  ↓
  │
  ▼
explainer.ts
  1. Read file content (vscode.workspace.fs)
  2. Read file path (relativize for context)
  3. Build prompt (prompt.ts)
  4. Call Claude API (stream: true)
  │
  ▼
sidebar.ts (WebviewViewProvider)
  postMessage({type: 'token', value: chunk})
  postMessage({type: 'done'})
  │
  ▼
panel.js (in webview)
  Accumulates tokens
  Renders TL;DR section as it arrives
  Renders full sections as they arrive
  Collapses sections on 'done'
```

---

## Key VS Code APIs

| What | API |
|------|-----|
| Register sidebar panel | `vscode.window.registerWebviewViewProvider('codelingo.sidebar', provider)` |
| Detect file switch | `vscode.window.onDidChangeActiveTextEditor` |
| Read file content | `vscode.workspace.fs.readFile(uri)` |
| Store API key | `context.secrets.store('codelingo.apiKey', key)` |
| Retrieve API key | `context.secrets.get('codelingo.apiKey')` |
| Send message to webview | `webviewView.webview.postMessage({...})` |
| Receive message from webview | `webviewView.webview.onDidReceiveMessage` |

---

## package.json — Extension Manifest

Key fields:

```json
{
  "name": "codelingo",
  "displayName": "CodeLingo",
  "description": "Understand AI-generated code without leaving your editor",
  "version": "0.1.0",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "keywords": ["vibe coding", "AI code", "code comprehension", "explain code"],
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "views": {
      "explorer": [{
        "id": "codelingo.sidebar",
        "name": "CodeLingo",
        "type": "webview"
      }]
    },
    "commands": [
      {
        "command": "codelingo.explainFile",
        "title": "CodeLingo: Explain This File"
      },
      {
        "command": "codelingo.setApiKey",
        "title": "CodeLingo: Set API Key"
      }
    ]
  }
}
```

**Where it appears:** Explorer sidebar (same pane as file tree). Developer sees it every time they open a file.

---

## First-Run Flow (API Key)

```
Extension activates
  │
  context.secrets.get('codelingo.apiKey')
  ├── Found → proceed normally
  └── Not found ↓

  Show information message:
  "CodeLingo needs your Anthropic API key to explain files.
   Your key is stored in VS Code SecretStorage — never committed to git."
  [Enter Key] [Learn More]

  User clicks [Enter Key]:
    InputBox with password=true
    context.secrets.store('codelingo.apiKey', value)
    Show: "API key saved. CodeLingo will explain the active file."
    → trigger explain for current file
```

---

## Prompt (prompt.ts)

Port explain-file.md directly. The extension builds this prompt:

```typescript
export function buildExplainPrompt(filePath: string, content: string): string {
  return `
Your job is to help a developer understand an unfamiliar source file quickly and safely.

File: ${filePath}

\`\`\`
${content}
\`\`\`

## First guard
If this file appears to be generated code, minified, binary-like, or a lockfile:
- say this is not a good candidate for explanation and why
- stop

## Output format

### 1) TL;DR (output this first, before anything else)
- Purpose: one sentence describing what this file is for
- Entry points: main entry points, exported symbols, or where to start reading
- Watch out: the main gotcha, risk, or confusing part

### 2) Full analysis
#### Role
#### Inputs / Outputs
#### Control Flow
#### Dependencies
#### Gotchas
#### What to read next

### 3) Line citations
Whenever making a concrete claim, cite line numbers (e.g. Line 12, Lines 20-28).

### 4) Confidence
At the end:
- Confidence: High / Medium / Low
- Why: one short explanation

## Style
- be concrete
- optimize for time-to-understanding
- do not be verbose
- do not overclaim
`.trim();
}
```

---

## fileGuard.ts — Exclusion Rules

Check before calling Claude:

```typescript
const EXCLUDED_PATTERNS = [
  /node_modules\//,
  /\.min\.(js|css)$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.map$/,
];

const GENERATED_MARKERS = [
  'DO NOT EDIT',
  'This file is auto-generated',
  'Code generated by',
  '@generated',
];

export function shouldExclude(filePath: string, content: string): string | null {
  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(filePath)) return 'Auto-generated or dependency file — no explanation needed.';
  }
  const firstLines = content.slice(0, 500);
  for (const marker of GENERATED_MARKERS) {
    if (firstLines.includes(marker)) return 'Auto-generated file (detected DO NOT EDIT marker).';
  }
  if (content.length > 0 && content.split('\n').length < 5 && content.length > 5000) {
    return 'Minified file — no explanation useful.';
  }
  return null; // proceed
}
```

---

## Claude API Call (explainer.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';

export async function explainFile(
  apiKey: string,
  filePath: string,
  content: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  const client = new Anthropic({ apiKey });
  const prompt = buildExplainPrompt(filePath, content);

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        onToken(chunk.delta.text);
      }
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
```

**Error handling (from Reviewer Concern #2):**
- 429 (rate limit): Show in panel: "Rate limit reached. Wait a moment and click ↻ to retry."
- 401 (invalid key): Show: "API key invalid. Click ⚙ to update your key."
- 5xx: Show: "Claude API error. Click ↻ to retry."
- Network failure: Show: "Could not reach Claude API. Check your connection."
- Never silently fail. Never show partial output without a visible warning.

---

## fileWatcher.ts — Auto-Trigger

```typescript
const DEBOUNCE_MS = 500;
let debounceTimer: NodeJS.Timeout | undefined;

export function registerFileWatcher(
  context: vscode.ExtensionContext,
  onFileChange: (editor: vscode.TextEditor) => void
): void {
  // Trigger on file switch
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onFileChange(editor), DEBOUNCE_MS);
    })
  );

  // Also trigger on first activation if a file is already open
  if (vscode.window.activeTextEditor) {
    onFileChange(vscode.window.activeTextEditor);
  }
}
```

**Auto-trigger is OFF by default.** Can be disabled in settings (`codelingo.autoExplain: false`). The Phase 1 validator flagged this risk — keep it off as a config option but on as default since the extension context is less intrusive than a CLI popup.

---

## Latency Handling (from Reviewer Concern #1)

- First token target: < 2 seconds (Claude API streaming latency)
- Full TL;DR: 3–5 seconds
- Full analysis: 8–15 seconds for a 200–500 line file

**What the user sees:**
```
[Analyzing DebouncedSearchPanel.tsx...]  ← spinner, appears immediately
```
Then TL;DR tokens stream in, replacing the spinner line by line.

**No progress bar needed** — streaming output IS the progress bar. The user sees text arriving, which signals that it's working.

---

## File Size Handling

| File size | Strategy |
|-----------|----------|
| < 500 lines | Single-pass, full content in prompt |
| 500–1000 lines | Single-pass, warn: "Large file — analysis may take 15-20s" |
| > 1000 lines | Two-pass: chunk by function/class (split on `function `, `class `, `def `, `fun `) → summarize each chunk → synthesize. Show: "Large file — analyzing in sections..." |

For Phase 2, implement single-pass first (covers 90% of real-world files). Two-pass is a fast-follow if users report truncated output.

---

## Implementation Order

Build in this order. Each step is independently shippable.

**Step 1 — Scaffold (Day 1)**
- `package.json` with extension manifest
- `extension.ts` registers the sidebar view
- `sidebar.ts` WebviewViewProvider with static "Hello CodeLingo" HTML
- Verify: sidebar appears in VS Code Explorer pane

**Step 2 — API Key (Day 1)**
- `apiKeyManager.ts` with SecretStorage
- First-run prompt on activation
- Settings command to update key
- Verify: key stored and retrieved correctly, not visible in git

**Step 3 — Explain Core (Day 2)**
- `prompt.ts` — port explain-file.md
- `explainer.ts` — calls Claude API, streams tokens
- Wire to a manual command `codelingo.explainFile`
- Verify: running command on a test file produces streamed explanation in console

**Step 4 — Sidebar Rendering (Day 2)**
- `panel.html` + `panel.css` + `panel.js`
- Receive postMessage tokens, render TL;DR first
- Collapsible sections for full analysis
- Verify: explanation renders correctly in sidebar panel

**Step 5 — File Watcher (Day 3)**
- `fileWatcher.ts` with 500ms debounce
- Connect to explainer + sidebar
- Verify: switching files updates the sidebar automatically

**Step 6 — File Guard (Day 3)**
- `fileGuard.ts` — exclusion patterns
- Sidebar shows appropriate messages for excluded files
- Verify: node_modules, .min.js, lockfiles show correct message, not blank

**Step 7 — Error States (Day 3)**
- Implement all 4 error states (rate limit, auth, 5xx, network)
- Verify: can simulate each by temporarily using a bad API key or no connection

**Step 8 — Polish (Day 4)**
- Auto-trigger toggle in settings
- Loading spinner state
- Re-run button (↻)
- Settings button (⚙) → opens key update flow
- Verify: full UX flow from first install through explanation

---

## What Phase 2 Does NOT Include

Explicitly deferred:

- `/change-impact` and `/handoff` — Phase 1b (validate explain-file in extension first)
- Multi-file / directory analysis — Phase 3
- ts-morph AST tracing — requires companion CLI (`npx codelingo-analyze`), Phase 2 fast-follow
- "Explain selection" (selected function/class) — Phase 2 fast-follow after core is validated
- GitHub PR integration — Phase 3
- Team sharing of explanations — Phase 3
- Support for GPT-4o as backend — Phase 3

---

## Success Criteria for Phase 2

The same fear-reduction metric from Phase 1, but measured in the sidebar:

1. Fear score improves ≥ 1 point (1–5 scale) after seeing explanation in sidebar
2. User makes the change they planned (task completion = Y)
3. "Hard to read because separated from code files" complaint disappears from feedback

If any user says "I had to stop looking at the code to read the explanation" — that's a failure. The sidebar must stay visible while editing.

---

## Distribution

- Publish to VS Code Marketplace: `vsce package && vsce publish`
- Package ID: `codelingo.codelingo`
- GitHub Actions: on tag push → `npm run build && vsce publish`
- README must include: "Your API key is stored in VS Code SecretStorage and is never committed to git."

---

## Open Questions Before Starting

1. **Claude model**: Use `claude-sonnet-4-6` as default (current best balance of speed/quality). Allow override in settings?
2. **Language scope**: Explain any file type (current Phase 1 prompt works on Python, Kotlin, etc.) or restrict to TS/JS first? **Recommendation: any file type, same as Phase 1.**
3. **Sidebar location**: Explorer pane (file tree area) or dedicated Activity Bar icon? **Recommendation: Explorer pane for Phase 2 (less surface area to claim, developer sees it naturally).**
