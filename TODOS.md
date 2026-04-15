# CodeLingo TODOs

## TODO-1: Per-language skillLevel storage

**What:** Change `skillLevel` in `config.json` from a single global value to a map keyed by language.

**Why:** One global `skillLevel` fails for multi-language projects. A user who is expert in TypeScript but a beginner in Rust will get the wrong calibration when switching. Codex flagged this during eng review (2026-03-29).

**Pros:** Correct calibration per language without any user friction — the prompt already infers the language from the file extension.

**Cons:** Slightly more complex config schema; requires migration if a user already has a scalar `skillLevel` saved. The prompt must handle both formats gracefully during a transition period.

**Context:** `skillLevel` is saved to `.codelingo/config.json` in Step 1b. The prompt infers language from `$ARGUMENTS` file extension. Proposed schema:
```json
{
  "language": "ko",
  "skillLevel": {
    "Python": "beginner",
    "TypeScript": "expert"
  }
}
```
The prompt should fall back to asking if the current file's language key is absent. On save, merge into the map — do not overwrite other language entries.

**Depends on / blocked by:** None. Additive change to `explain-file.md` only.

---

## TODO-2: Validation runs 6–10

**What:** Run 5 new manual validation sessions targeting the skill level + tiered comment injection features, and record results in `docs/VALIDATION.md`.

**Why:** Runs 1–5 validated the core explain + .codelingo/ file output. Runs 6–10 validate the new features added in this session: skill level calibration, comment injection options B/C, config merge behavior, and idempotency.

**Pros:** Confirms the features work as designed before sharing with external testers. Closes the eval gaps flagged in the test review.

**Cons:** Takes ~30–60 minutes of manual testing.

**Context:** Each run should follow the VALIDATION.md template. Key questions per run:
- Run 6: `.py` file + `beginner` + option B — Does config.json merge correctly? Are comments jargon-free?
- Run 7: `.ts` file + `expert` + option A — Is the analysis noticeably terser than a beginner run?
- Run 8: `.py` file + `beginner` + option C — Are trivial lines actually skipped? Does it slow down?
- Run 9: `.ts` file + `familiar` + option B — Are pattern names used (e.g., "factory function")?
- Run 10: Re-run any file from runs 6–9 — Does Step 1b skip entirely on second run?

**Depends on / blocked by:** None. Run after the current changes are validated locally.
