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
| Page load benchmarks | [tests/performance/AGENTS.md](tests/performance/AGENTS.md) |

## Load performance
Every page load waits on `/api/info`, then the route's own queries. Keep anything else off that path, and check changes with the page load benchmarks (`yarn perf:build`, see the guide).
- Don't gate built in pages on addon remote modules (`useLoadRemotePages`, `useLoadModule`): addon bundles are large. Render with the fallback, or only wait when the current page is the addon's.
- Work nobody waits for on load (prompts, banners, third party widgets, rarely used addon modules) starts after `afterStartup` / `useAfterStartup` (`@shared/util`, `@shared/hooks`).
- `useLoadModule`: `skip` means the module is provided elsewhere (reported as not loading), `defer` means don't load it yet (reported as loading).
- Browsers run 6 requests per host at once over HTTP/1.1. Don't add start up requests that duplicate a cached query under another cache key (e.g. different args for the same endpoint).
- Load heavy libraries that are only used in some places (code editors, markdown/HTML parsers, dialogs) with `lazy()` / `import()`, so they stay out of the main bundle.
- `index.html` starts `/api/info?full=true` before the bundle loads (`src/helpers/earlySiteInfo.ts`). Keep its request in sync with the `getSiteInfo` call in `src/app.tsx`.

## Hot reload
- A `.tsx`/`.jsx` file that defines components must export only components (types are fine). Put everything else in a sibling module:
  - contexts: `createContext` and hooks go in `<Name>ContextInstance.ts`, which barrels also export
  - exported styled-components go in `<Name>.styled.ts`
  - helpers, constants, enums and Lexical commands go in `<Name>Helpers.ts`
- Keep `*ContextInstance.ts` modules free of runtime imports that lead back to their provider (e.g. through a barrel like `../context` or `../utils`). When a file changes, Vite re-creates every module that imports it, even indirectly, so a context module inside such an import cycle gets a second `createContext()` and consumers throw "must be used within a Provider". Put helpers that need those imports in `<Name>Helpers.ts`.
- If you break the first rule, React Fast Refresh can't swap the file. Vite then re-runs every importer, and through the barrels that reaches `app.tsx`, whose module-level `lazy()` routes remount the whole app.
- Keep `src/index.tsx` free of components; the root tree lives in `src/AppRoot.tsx`. An entry file that defines a component gets re-run on hot updates and mounts a second React root.
- To check: `hmr invalidate … Could not Fast Refresh` in the dev-server log names the file that breaks the rule.

## Errors
- Do not use `transformErrorResponse`; use `getRequestErrorString`, and keep all RTK Query errors, including GraphQL errors, in the standard `{ status, data: { code, detail, ... } }` model.
- Preserve the standard RTK error envelope and backend fields; do not replace it with a string or a custom endpoint shape.
- Use `getRequestErrorString` for user-facing request error messages.
- Do not add duplicate logging for RTK Query failures already logged by the shared base client.
- Keep success `transformResponse` implementations when they are needed; the restriction applies to `transformErrorResponse`.
- Preserve domain-specific `errorCodes` handling where callers use it for control flow.