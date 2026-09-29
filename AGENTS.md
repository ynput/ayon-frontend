# Agent Instructions


## Errors
- Do not use `transformErrorResponse`; use `getRequestErrorString`, and keep all RTK Query errors, including GraphQL errors, in the standard `{ status, data: { code, detail, ... } }` model.
- Preserve the standard RTK error envelope and backend fields; do not replace it with a string or a custom endpoint shape.
- Use `getRequestErrorString` for user-facing request error messages.
- Do not add duplicate logging for RTK Query failures already logged by the shared base client.
- Keep success `transformResponse` implementations when they are needed; the restriction applies to `transformErrorResponse`.
- Preserve domain-specific `errorCodes` handling where callers use it for control flow.