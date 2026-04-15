Your job is to help a developer understand the blast radius of a proposed change before they make it — so they can modify code confidently without breaking things they didn't expect.

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
| Change summary | 변경 요약 | 変更概要 | 变更摘要 |
| What this file does | 이 파일의 역할 | このファイルの役割 | 此文件的作用 |
| Direct impact | 직접 영향 | 直接的な影響 | 直接影响 |
| Likely callers | 예상 호출자 | 想定される呼び出し元 | 可能的调用方 |
| Risk | 위험도 | リスク | 风险 |
| Before you change | 변경 전 확인 | 変更前の確認 | 变更前检查 |
| After you change | 변경 후 확인 | 変更後の確認 | 变更后检查 |
| Confidence | 신뢰도 | 信頼度 | 置信度 |

## Step 2: Parse arguments

`$ARGUMENTS` may contain:
- Just a file path: `src/utils/scheduler.py`
- A file path + change description: `src/utils/scheduler.py "I want to add a retry limit parameter"`

Parse accordingly. If only a file path is provided, proceed to Step 3 and ask for the change description after the guard.

## Step 3: Read the file

Read the file at the provided path.

If no file path is provided, ask: "Which file are you planning to change?"

## Step 4: First guard — reject noisy or non-source files

Before any analysis, check whether the file is:
- generated code (contains "DO NOT EDIT", "@generated", "AUTO-GENERATED")
- minified code (very few lines, very large content)
- a lockfile (package-lock.json, yarn.lock, pnpm-lock.yaml)
- inside node_modules/, dist/, .git/
- a binary or .map file

If so:
- clearly say this is not a good candidate for analysis and why (in the chosen language)
- stop

## Step 5: Get the proposed change

If the change description was not in `$ARGUMENTS`, ask the user (in the chosen language):

English: "What do you want to change in this file?"
한국어: "이 파일에서 어떤 변경을 하려고 하나요?"
日本語: "このファイルで何を変更しようとしていますか？"
中文: "您打算对这个文件做什么更改？"

## Step 6: Analyze the impact

Produce the impact analysis in the chosen language using this structure:

### <Change summary heading>
One sentence: what the user wants to change and in which file.

### <What this file does heading>
2–3 sentences on what this file is responsible for. This is context for the impact, not a full explanation. Cite key line ranges.

### <Direct impact heading>
What parts of THIS file will be affected by the proposed change:
- Which functions, classes, or variables will need to be modified (with line numbers)
- What signatures, return types, or behaviors will change
- Any constants, configs, or defaults that need to update

### <Likely callers heading>
What outside code likely depends on the parts being changed. Since this is LLM-only (no AST tracing), reason from:
- The file's exported symbols visible in this file
- Import patterns, naming conventions, and file location
- Common patterns for this type of module (e.g., a scheduler is likely called from an entry point or job runner)

Be explicit about the confidence of each inference. Format as:
- `probably`: high likelihood based on naming/structure
- `possibly`: reasonable guess, verify before changing
- `unknown`: cannot determine without tracing imports

### <Risk heading>
**High / Medium / Low** — one line explaining why.

Also flag if the file uses patterns that limit LLM analysis confidence:
- Event emitters or message buses (changes may not propagate as expected)
- Dependency injection (callers may not be visible in this file)
- Dynamic imports or string-based routing
- Decorators or annotations that modify behavior

If any of these are present, add:
> ⚠ Dynamic patterns detected — LLM impact analysis only. Verify caller list manually or with a static analysis tool.

### <Before you change heading>
A checklist of things to understand or verify BEFORE making the change:
- [ ] item 1
- [ ] item 2
...

### <After you change heading>
A checklist of things to test or verify AFTER making the change:
- [ ] item 1
- [ ] item 2
...

At the end, add:
- **<Confidence heading>:** High / Medium / Low
- **Why:** one short explanation (in the chosen language). Low confidence should be explicit: "This file uses [pattern] which limits static impact tracing."

## Step 7: Save to .codelingo/

Create the analysis file:
- Path: `.codelingo/change-impact-<filename>.md` (filename only, no directory structure)
  - Example: `src/utils/job_scheduler.py` → `.codelingo/change-impact-job_scheduler.md`
- If `.codelingo/` does not exist, create it
- Overwrite if the file already exists

File format:

```
# Change Impact: <filename>

> Analyzed: <today's date> | <Confidence heading>: <High/Medium/Low> | Language: <language>
> Source: <relative file path>
> Proposed change: <one-line summary of what the user wants to change>

## <Change summary heading>
...

## <What this file does heading>
...

## <Direct impact heading>
...

## <Likely callers heading>
...

## <Risk heading>
...

## <Before you change heading>
- [ ] ...

## <After you change heading>
- [ ] ...
```

After writing the file, tell the user (in the chosen language):
"Impact analysis saved to `.codelingo/change-impact-<filename>.md`."

## Style rules
- Use the chosen language consistently throughout — never mix languages
- Be concrete — name specific functions, lines, and symbols
- Use "probably / possibly / unknown" explicitly for inferred callers
- Do not overclaim — LLM-only analysis has limits; say so clearly
- Checklists should be actionable, not generic ("Run the scheduler tests" not "Run tests")
