Your job is to generate a structured handoff document for a source file — something a new developer (or non-developer) can read to quickly understand what the code does, why it was built this way, and how to work with it safely.

## Step 1: Language preference

Check `.codelingo/config.json` for a `language` field.

If `language` is already set, use it for ALL output in this session.

If not, ask the user:

"Which language do you want explanations in?
A) English
B) 한국어
C) 日本語
D) 中文"

Save choice as `"language": "<en|ko|ja|zh>"` in `.codelingo/config.json`.
If the file already exists with other fields, merge — do not overwrite the whole file.

Use the chosen language for ALL output.

Section heading translations by language:

| English | 한국어 | 日本語 | 中文 |
|---------|--------|--------|------|
| Module purpose | 모듈 목적 | モジュールの目的 | 模块目的 |
| Architecture glossary | 아키텍처 용어 | アーキテクチャ用語集 | 架构术语 |
| Key decisions | 주요 결정 사항 | 主要な決定事項 | 关键决策 |
| Dependency map | 의존성 맵 | 依存関係マップ | 依赖关系图 |
| How to make common changes | 자주 하는 변경 방법 | よくある変更の方法 | 常见修改方法 |
| Known gotchas | 알려진 함정 | 既知の落とし穴 | 已知陷阱 |
| Confidence | 신뢰도 | 信頼度 | 置信度 |

## Step 2: Ask about the audience

Ask the user (in the chosen language) who will read this handoff document:

English: "Who is this handoff for?
A) Developer on the same team — knows the stack, just not this module
B) External developer — unfamiliar with the codebase and conventions
C) Non-developer — manager, PM, or stakeholder who needs the big picture"

한국어: "이 인수인계 문서는 누구를 위한 건가요?
A) 같은 팀 개발자 — 스택은 알지만 이 모듈은 처음
B) 외부 개발자 — 코드베이스와 컨벤션을 모르는 분
C) 비개발자 — 전체 그림이 필요한 매니저, PM, 이해관계자"

日本語: "このハンドオフドキュメントは誰のためですか？
A) 同じチームの開発者 — スタックは知っているが、このモジュールは初めて
B) 外部の開発者 — コードベースや規約に慣れていない方
C) 非開発者 — 全体像が必要なマネージャー、PM、ステークホルダー"

中文: "这份交接文档是为谁准备的？
A) 同团队开发者 — 了解技术栈，但不熟悉这个模块
B) 外部开发者 — 不熟悉代码库和规范的人
C) 非开发者 — 需要了解整体情况的经理、PM或利益相关者"

Calibrate the document depth to the audience:
- **same-team developer**: use technical terms freely, skip basics, focus on module-specific decisions and gotchas
- **external developer**: explain conventions and patterns, provide enough context to work independently
- **non-developer**: no code, no jargon — explain purpose, value, and risks in plain language; skip implementation details entirely

## Step 3: Read the file

Read the file at the path provided in `$ARGUMENTS`.

If no argument is provided, ask: "Which file do you want to generate a handoff for?"

## Step 4: First guard — reject noisy or non-source files

Before any analysis, check whether the file is:
- generated code (contains "DO NOT EDIT", "@generated", "AUTO-GENERATED")
- minified code (very few lines, very large content)
- a lockfile (package-lock.json, yarn.lock, pnpm-lock.yaml)
- inside node_modules/, dist/, .git/
- a binary or .map file

If so:
- clearly say this is not a good candidate for a handoff document and why (in the chosen language)
- stop

## Step 5: Generate the handoff document

Produce the full handoff document in the chosen language, calibrated to the audience.

### <Module purpose heading>
**For same-team / external developer:** 2–3 sentences. What this file is responsible for in the system. What it does NOT do (scope boundaries). Where it fits in the overall architecture.

**For non-developer:** Plain language. What problem this solves. Why it exists. What would break if it were removed.

### <Architecture glossary heading>
*Skip for non-developer audience.*

A short glossary of terms, patterns, and conventions used in this file that a new developer might not recognize. Format as:
- **Term**: one-line definition in the context of this file

Only include terms that are non-obvious or specific to this codebase. Skip generic language constructs.

### <Key decisions heading>
The top 2–4 design decisions that shaped this file — and WHY they were made. Focus on decisions that are non-obvious or that future maintainers might be tempted to change. Format as:
- **Decision**: what was chosen
  **Why**: the reasoning or constraint that drove it
  **Do not change unless**: the condition that would make this decision obsolete

**For non-developer:** Rephrase as "Why it was built this way" with plain-language rationale.

### <Dependency map heading>
*Skip for non-developer audience.*

What this file depends on (imports, external services, config), and what likely depends on this file (LLM-inferred from exports and naming). Be explicit about inference confidence:
- **Depends on**: list of dependencies visible in this file
- **Likely depended on by**: inferred callers (mark each as `probably` / `possibly` / `unknown`)

### <How to make common changes heading>
The top 2–3 changes a new developer is most likely to need to make, with step-by-step instructions. Format as:

**Change: [description]**
1. Step one
2. Step two
3. What to test after

*Skip for non-developer audience unless relevant.*

### <Known gotchas heading>
The things that will trip up someone who is new to this file. Things that look safe to change but aren't. Hidden assumptions. Stateful behavior. Order-of-operations requirements. Format as:
- **Gotcha**: what it is and why it's dangerous

**For non-developer:** Only include gotchas that have business impact (e.g., "changing X will affect Y users"). Skip implementation-only concerns.

At the end, add:
- **<Confidence heading>:** High / Medium / Low
- **Why:** one short explanation (in the chosen language)

## Step 6: Save to .codelingo/

Create the handoff file:
- Path: `.codelingo/HANDOFF-<filename>.md` (filename only, no directory structure)
  - Example: `src/utils/job_scheduler.py` → `.codelingo/HANDOFF-job_scheduler.md`
- If `.codelingo/` does not exist, create it
- Overwrite if the file already exists

File format:

```
# Handoff: <filename>

> Generated: <today's date> | <Confidence heading>: <High/Medium/Low> | Language: <language>
> Source: <relative file path>
> Audience: <same-team developer | external developer | non-developer>

## <Module purpose heading>
...

## <Architecture glossary heading>
...

## <Key decisions heading>
...

## <Dependency map heading>
...

## <How to make common changes heading>
...

## <Known gotchas heading>
...
```

After writing the file, tell the user (in the chosen language):
"Handoff document saved to `.codelingo/HANDOFF-<filename>.md`. Share this file alongside the source."

## Step 7: Offer comment injection

Ask the user (in the chosen language):

English: "Want me to also add a TL;DR comment block at the top of the source file pointing to this handoff document? (Y/N)"
한국어: "소스 파일 맨 위에 이 인수인계 문서를 가리키는 TL;DR 주석 블록을 추가할까요? (Y/N)"
日本語: "ソースファイルの先頭にこのハンドオフドキュメントへのTL;DRコメントブロックを追加しますか？(Y/N)"
中文: "是否在源文件顶部添加指向此交接文档的TL;DR注释块？(Y/N)"

If Y:
Check for idempotency and special first lines (same rules as /explain-file Step 6 option A):
1. If a CODELINGO or HANDOFF block already exists, replace it instead of inserting a new one.
2. If the file starts with a shebang (`#!`), encoding declaration (`# -*- coding`), or Go build tag (`//go:build`), insert AFTER that line.

Then add the appropriate comment block for the language:

For Python / Shell / Ruby / Bash (# comments):
```
# =============================================================
# CODELINGO HANDOFF — <filename>
# Generated: <date> | Audience: <audience>
#
# Purpose: <one sentence>
# Key decisions: <top decision>
# Watch out: <top gotcha>
#
# Full handoff: .codelingo/HANDOFF-<filename>.md
# =============================================================
```

For JavaScript / TypeScript / Java / Kotlin / Swift / Go (// comments):
```
// =============================================================
// CODELINGO HANDOFF — <filename>
// Generated: <date> | Audience: <audience>
//
// Purpose: <one sentence>
// Key decisions: <top decision>
// Watch out: <top gotcha>
//
// Full handoff: .codelingo/HANDOFF-<filename>.md
// =============================================================
```

For CSS / C / C++ (/* comments */):
```
/* =============================================================
   CODELINGO HANDOFF — <filename>
   Generated: <date> | Audience: <audience>

   Purpose: <one sentence>
   Key decisions: <top decision>
   Watch out: <top gotcha>

   Full handoff: .codelingo/HANDOFF-<filename>.md
   ============================================================= */
```

If N:
Done. No changes to the source file.

## Style rules
- Use the chosen language consistently throughout — never mix languages
- Calibrate vocabulary ruthlessly to the audience — never use jargon with non-developers
- Be concrete — name specific functions, lines, and decisions
- Do not overclaim — use "probably / possibly / unknown" for inferred dependencies
- "Key decisions" should explain WHY, not just WHAT — the why is what new developers miss
