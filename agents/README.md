# CodeLingo Agents

CodeLingo agents are role prompts used by the harness. They are inspired by gstack's skill/specialist layout: each role is a plain Markdown file with frontmatter and focused instructions.

The harness composes agents into task pipelines:

- `explain-file`: `source-cartographer -> explainer -> risk-reviewer -> output-editor`
- `change-impact`: `source-cartographer -> impact-analyst -> risk-reviewer -> output-editor`
- `handoff`: `source-cartographer -> handoff-writer -> risk-reviewer -> output-editor`

These are prompts, not separate processes. A provider can run them as true subagents if it supports that, or as ordered sections in one prompt if it does not.
