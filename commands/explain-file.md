Your job is to help a developer understand an unfamiliar source file quickly and safely, and save the result where they can read it alongside their code.

## Step 1: Language and skill level

Check `.codelingo/config.json` for both `language` and `skillLevel` fields.

### 1a. Language

If `language` is already set, use it for ALL output in this session.

If not, ask the user:

"Which language do you want explanations in?
A) English
B) 한국어
C) 日本語
D) 中文"

Save choice as `"language": "<en|ko|ja|zh>"` in `.codelingo/config.json`.

### 1b. Skill level with this language/codebase

Before asking, infer the programming language from the file extension in `$ARGUMENTS`:
- `.py` → Python, `.ts` / `.tsx` → TypeScript, `.js` / `.jsx` → JavaScript
- `.go` → Go, `.rb` → Ruby, `.java` → Java, `.kt` → Kotlin
- `.swift` → Swift, `.rs` → Rust, `.c` / `.cpp` / `.h` → C/C++
- `.css` / `.scss` → CSS, `.sh` / `.bash` → Shell
- Any other extension → use "this language"

If `skillLevel` is already set, use it silently — do not ask again.

If not, ask the user (in the chosen language), substituting `<Language>` with the inferred name:

English: "How familiar are you with <Language>?
A) Beginner — I vibe-coded this or I'm learning
B) Familiar — I know the language, just not this codebase
C) Expert — I'm a senior dev who just needs orientation"

한국어: "<Language>에 얼마나 익숙하신가요?
A) 초보 — 바이브 코딩했거나 배우는 중이에요
B) 보통 — 언어는 알지만 이 코드베이스는 낯설어요
C) 숙련 — 시니어 개발자, 전체 흐름만 파악하면 돼요"

日本語: "<Language>にどれくらい慣れていますか？
A) 初級 — バイブコーディングしたか、学習中です
B) 普通 — 言語は知っているが、このコードベースは初めてです
C) 上級 — シニアエンジニアで、全体像だけ把握したいです"

中文: "您对 <Language> 的熟悉程度如何？
A) 初级 — 我是氛围编程或正在学习
B) 熟悉 — 我了解这门语言，只是不熟悉这个代码库
C) 专家 — 我是高级开发者，只需要整体概览"

Save choice as `"skillLevel": "<beginner|familiar|expert>"` in `.codelingo/config.json`.
If the file already exists with other fields, merge — do not overwrite the whole file.

To reset skill level: delete the `skillLevel` field from `.codelingo/config.json` and re-run the command.

Use the chosen language for ALL output: section headings, analysis text, TL;DR bullets, code comments, and messages to the user.

Section heading translations by language:

| English | 한국어 | 日本語 | 中文 |
|---------|--------|--------|------|
| TL;DR | TL;DR | TL;DR | TL;DR |
| Purpose | 목적 | 目的 | 目的 |
| Entry points | 진입점 | エントリーポイント | 入口点 |
| Watch out | 주의 | 注意 | 注意 |
| Role | 역할 | 役割 | 职责 |
| Inputs / Outputs | 입력 / 출력 | 入力 / 出力 | 输入 / 输出 |
| Control Flow | 제어 흐름 | 制御フロー | 控制流 |
| Dependencies | 의존성 | 依存関係 | 依赖关系 |
| Gotchas | 함정 | 落とし穴 | 陷阱 |
| What to read next | 다음에 읽을 것 | 次に読むべきもの | 下一步阅读 |
| Confidence | 신뢰도 | 信頼度 | 置信度 |

## Step 2: Read the file

The user provides a file path as $ARGUMENTS. Read the file at that path.

If no argument is provided, ask: "Which file do you want to explain?"

## Step 3: First guard — reject noisy or non-source files

Before any analysis, check whether the file is:
- generated code (contains "DO NOT EDIT", "@generated", "AUTO-GENERATED")
- minified code (very few lines, very large content)
- a lockfile (package-lock.json, yarn.lock, pnpm-lock.yaml)
- inside node_modules/, dist/, .git/
- a binary or .map file

If so:
- clearly say this is not a good candidate for explanation and why (in the chosen language)
- stop

## Step 4: Analyze the file

Calibrate the explanation depth to the user's skill level:

- **beginner**: Avoid jargon. Explain concepts as well as code. Use analogies. Be explicit about what each part does and why it matters. Assume they may not recognize common patterns.
- **familiar**: Balanced. Name the patterns (e.g. "this is a factory function", "this uses the observer pattern"). Focus on what's specific to this codebase, not what's general to the language.
- **expert**: Terse. Skip basics. Focus on architecture decisions, non-obvious design choices, gotchas, and what makes this file different from a standard implementation.

Produce the full explanation in the chosen language using this structure:

### TL;DR
Exactly these 3 bullets (use translated heading names from the table above):
- **<Purpose heading>:** one sentence describing what this file is for
- **<Entry points heading>:** main entry points, exported symbols, or where to start reading
- **<Watch out heading>:** the main gotcha, risk, or confusing part

### <Role heading>
What responsibility this file has in the system.

### <Inputs / Outputs heading>
Important inputs, outputs, side effects, and major data transformations.

### <Control Flow heading>
The main flow through the file. What functions/classes matter most. Suggested reading order.

### <Dependencies heading>
Important internal or external dependencies visible in this file.

### <Gotchas heading>
Risky logic. Hidden assumptions. Stateful behavior. Parts that are likely hard to modify safely.

### <What to read next heading>
Suggest the next file, function, or dependency to inspect.

For every concrete claim, cite line numbers: Line 12, Lines 20-28.

At the end, add:
- **<Confidence heading>:** High / Medium / Low
- **Why:** one short explanation (in the chosen language)

## Step 5: Save to .codelingo/

Create the explanation file:
- Path: `.codelingo/<filename>.md` (filename only, no directory structure)
  - Example: `src/utils/job_scheduler.py` → `.codelingo/job_scheduler.md`
- If `.codelingo/` does not exist, create it
- Overwrite if the file already exists

File format:

```
# <filename>

> Analyzed: <today's date> | <Confidence heading>: <High/Medium/Low> | Language: <language>
> Source: <relative file path>

## TL;DR

- **<Purpose heading>:** ...
- **<Entry points heading>:** ...
- **<Watch out heading>:** ...

## <Role heading>
...

## <Inputs / Outputs heading>
...

## <Control Flow heading>
...

## <Dependencies heading>
...

## <Gotchas heading>
...

## <What to read next heading>
...
```

After writing the file, tell the user (in the chosen language):
"Explanation saved to `.codelingo/<filename>.md`. Open it side-by-side with the source file."

## Step 6: Offer comment injection

Ask the user (in the chosen language) which level of comments to add to the source file.

English: "Want me to add comments directly to the source file?
N) No — keep the source file unchanged
A) TL;DR header only — one summary block at the top of the file
B) Function / class level — a brief comment before each function and class
C) Line by line — inline comments on every non-obvious line (⚠ slow on files over 200 lines)"

한국어: "소스 파일에 주석을 추가할까요?
N) 아니요 — 소스 파일은 그대로 둡니다
A) TL;DR 헤더만 — 파일 맨 위에 요약 블록 하나
B) 함수 / 클래스 단위 — 각 함수와 클래스 앞에 간단한 설명
C) 줄 단위 — 복잡한 로직 줄마다 인라인 주석 (⚠ 200줄 이상 파일은 시간이 오래 걸릴 수 있어요)"

日本語: "ソースファイルにコメントを追加しますか？
N) いいえ — ソースファイルはそのままにします
A) TL;DR ヘッダーのみ — ファイル先頭に要約ブロックを一つ
B) 関数 / クラス単位 — 各関数・クラスの前に簡単な説明
C) 行単位 — 難解なロジックの行ごとにインラインコメント (⚠ 200行超のファイルは時間がかかります)"

中文: "要在源文件中添加注释吗？
N) 否 — 保持源文件不变
A) 仅 TL;DR 头部 — 在文件顶部添加一个摘要块
B) 函数 / 类级别 — 在每个函数和类前添加简短说明
C) 逐行 — 对每个不明显的逻辑行添加内联注释 (⚠ 超过200行的文件处理较慢)"

---

### If N:
Done. No changes to the source file.

---

### If A — TL;DR header block:

**Before inserting, check for idempotency and special first lines:**

1. If the file already contains a CODELINGO block (look for `# CODELINGO`, `// CODELINGO`, or `/* CODELINGO`), **replace** the existing block instead of inserting a new one.
2. If the file starts with a special first line that must remain first, insert the header **after** that line, not before it:
   - Shebang: `#!/usr/bin/env ...` or `#!/bin/...`
   - Python encoding: `# -*- coding: ...`
   - Go build tag: `//go:build ...`

Add this comment block (after applying the checks above), with text in the chosen language:

For Python / Shell / Ruby / Bash (# comments):
```
# =============================================================
# CODELINGO — <filename>
# Analyzed: <date>
#
# <Purpose heading>: <one sentence>
# <Entry points heading>: <entry points>
# <Watch out heading>: <main gotcha>
#
# Full explanation: .codelingo/<filename>.md
# =============================================================
```

For JavaScript / TypeScript / Java / Kotlin / Swift / Go (// comments):
```
// =============================================================
// CODELINGO — <filename>
// Analyzed: <date>
//
// <Purpose heading>: <one sentence>
// <Entry points heading>: <entry points>
// <Watch out heading>: <main gotcha>
//
// Full explanation: .codelingo/<filename>.md
// =============================================================
```

For CSS / C / C++ (/* comments */):
```
/* =============================================================
   CODELINGO — <filename>
   Analyzed: <date>

   <Purpose heading>: <one sentence>
   <Entry points heading>: <entry points>
   <Watch out heading>: <main gotcha>

   Full explanation: .codelingo/<filename>.md
   ============================================================= */
```

---

### If B — Function / class level:

First add the TL;DR header block (same as option A) at the top of the file.

Apply the same skill level calibration from Step 4 to all comment vocabulary:
- **beginner**: plain language, no jargon, explain concepts
- **familiar**: name patterns, direct and specific
- **expert**: terse, highlight only non-obvious behavior

Then, for every function, class, and major block in the file, add a single-line doc comment immediately before it (in the chosen language). The comment should explain:
- What this function/class does (not just its name)
- Key parameter or return value if non-obvious

Use the language's idiomatic comment style:
- Python: `# ` before the def/class line (not docstring — keep it one line)
- JS/TS: `// ` before the function/class line
- Java/Kotlin/Swift: `// ` before the method/class line
- Go: `// ` before the func line
- C/C++: `// ` before the function

Do not add comments to trivial getters, one-liner helpers, or framework boilerplate where the name is self-explanatory.

---

### If C — Line by line:

First add the TL;DR header block (same as option A) at the top of the file.
Then add function/class comments (same as option B, including skill level calibration).

Then go through every non-trivial line in the file and add an inline end-of-line comment (in the chosen language) explaining:
- WHY this line exists, not just what it does
- What the value or state means at this point
- Any non-obvious side effect or gotcha

Skip trivial lines: simple variable declarations with obvious values, imports, closing braces, blank lines.

For very long files (> 200 lines), focus inline comments on:
1. Every branch condition (if/else/switch)
2. Every loop body
3. Every function call with non-obvious arguments
4. Every line the "Gotchas" section flagged

## Style rules
- Use the chosen language consistently throughout — never mix languages
- Be concrete
- Optimize for time-to-understanding
- Do not be verbose
- Do not overclaim
- For large or dense files, use a two-pass strategy internally: identify major blocks first, then synthesize — but always show TL;DR first
