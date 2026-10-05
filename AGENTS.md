# Agent Instructions

## Area guides
Some parts of the codebase have their own `AGENTS.md` next to the code. It explains how that area works, its data formats and contracts, the non-obvious decisions behind it, and how to check changes.
- Before changing code in an area that has a guide, read the guide.
- When a change makes a guide untrue, update it in the same PR.
- When you build or significantly rework an area that is hard to understand from the code alone, add a guide and list it below.
- Keep guides about what the code can't tell you quickly: contracts, the reasons behind decisions, ordering and priority rules, gotchas, and where else a change has to be made. Don't restate what the code says line by line.

| Area | Guide |
| --- | --- |
| Markdown editor (Lexical): comments, descriptions, text cells | [shared/src/components/MarkdownEditor/AGENTS.md](shared/src/components/MarkdownEditor/AGENTS.md) |
| Playwright tests: unit and e2e, fixtures, page objects | [tests/AGENTS.md](tests/AGENTS.md) |

## Errors
- Do not use `transformErrorResponse`; use `getRequestErrorString`, and keep all RTK Query errors, including GraphQL errors, in the standard `{ status, data: { code, detail, ... } }` model.
- Preserve the standard RTK error envelope and backend fields; do not replace it with a string or a custom endpoint shape.
- Use `getRequestErrorString` for user-facing request error messages.
- Do not add duplicate logging for RTK Query failures already logged by the shared base client.
- Keep success `transformResponse` implementations when they are needed; the restriction applies to `transformErrorResponse`.
- Preserve domain-specific `errorCodes` handling where callers use it for control flow.