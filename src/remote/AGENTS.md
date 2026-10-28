# Addon frontends (module federation)

Addons ship frontend modules that the host loads at runtime with module federation. `RemoteModulesProvider` (`shared/src/context/remote-modules`) registers every addon's `remoteEntry.js` from `/api/frontendModules`. `useLoadModule` / `useLoadRemotePages` then load the modules where they render.

## One store, api and set of contexts

Addons import `@ynput/ayon-frontend-shared` from npm. The host itself uses the same code from source (`@shared`). Without sharing, each addon would get its own copy of everything in that package: its own RTK Query `api` with its own cache, and its own React contexts. It would then need its own store and providers, and nothing would reach the host's cache.

The host shares these as singletons, so an addon that declares the same shares uses the host's instances:

| Package | How the host provides it |
| --- | --- |
| `react`, `react-dom`, `@ynput/ayon-react-components` | `shared` in the federation plugin (`vite.config.ts`) |
| `@reduxjs/toolkit`, `react-redux`, `react-router`, `react-router-dom`, `react-toastify`, `primereact/confirmdialog`, `@ynput/ayon-frontend-shared` and every subpath (`/api`, `/context`, `/Slicer`, ...) | `registerShared` at startup, with the host's own modules (`hostSharedModules.ts`, called from `src/index.tsx`) |

What an addon gets from that:
- RTK Query hooks from `/api` read and write the host's cache. A tag the host invalidates refetches addon queries and the other way round. A query the host already ran isn't requested again.
- Endpoints the addon injects (`api.injectEndpoints`, `enhanceEndpoints({ addTagTypes })`) go into the host's api.
- Slices go into the host store: `slice.injectInto(rootReducer)`, or `rootReducer.inject(...)`. Middleware goes in with `addMiddleware`. All of these come from `/api` (`shared/src/api/base/store.ts`).
- Shared contexts such as `GlobalContext`, `PowerpackContext`, `ProjectContext`, `ProjectFoldersContext`, `SlicerContext` and `ViewsContext` are the host's. An addon module only needs a provider the host doesn't already render above it.
- `useNavigate`, `useParams`, `useLocation` and `useSearchParams` work in addon modules, because they read the host's router. Without the share an addon's own copy of react-router has no router above it and these hooks throw. The `router` prop the host still passes to pages is only for addons that don't share react-router.
- `toast()` shows in the host's toast container. An addon's own copy of react-toastify has no container on the page, so its toasts never show. The `toast` prop is kept for the same reason as `router`.
- `confirmDialog()` (and `confirmDelete` from `/util`) opens the host's app-level `ConfirmDialog`. primereact opens every mounted `ConfirmDialog` from the copy that `confirmDialog` came from, so an addon that shares `primereact/confirmdialog` must not mount its own: the dialog would open twice. An addon that doesn't share it keeps needing its own `ConfirmDialog` for its own `confirmDialog` calls. Only this subpath is shared; other primereact components stay per copy.
- Every module renders under the Redux `Provider`, `GlobalProvider` and `PowerpackProvider` (`app.tsx`). Project page modules are also under the project providers (`ProjectPage.tsx`).

`ayon-addon-full-template` shows the addon side: its federation config, a slice and endpoints.

## Rules and gotchas

- **Keep `hostSharedEntries.ts` and `ENTRY_NAMES` in `hostSharedModules.ts` in sync with `build.lib.entry` in `shared/vite.config.ts`.** An entry the host doesn't provide falls back to the addon's own copy, and that copy brings its own api and contexts. `tests/unit/hostSharedModules.spec.ts` checks the lists match.
- **The host never `loadShare`s these.** It imports `@shared`, `@reduxjs/toolkit`, `react-redux`, the router, react-toastify and `primereact/confirmdialog` directly. The registration only hands those same module instances to addons. Don't move them into the plugin's `shared` config: that puts every host import of them behind an async share load at startup, which slowed page loads in the benchmarks. All entries load together through one lazy module (`hostSharedEntries.ts`) the first time an addon asks for one. A separate `import()` per entry gave the build 18 extra entry points and split the host's own page chunks into many small ones (8 more requests on the dashboard). One module costs fewer, but still splits a few tiny chunks (about 5 more requests on the dashboard). Static imports instead would add about 180 KB to the main bundle. They are marked `loaded: true` so the runtime picks them over an addon's bundled copy, even a newer one. A version mismatch only logs a warning.
- **The router is shared as a list of exports, not the whole module** (`hostRouterExports.ts`). `import * as` from react-router keeps its server, framework and data router code in the main bundle (about 370 KB). The list is the declarative API, because the host runs `<BrowserRouter>`: data router APIs (loaders, fetchers, `<Form>`, `createBrowserRouter`) can't work under it. An export missing from the list is `undefined` in an addon that shares the router, so add one there when an addon needs it.
- **`registerShared` must run before any remote is registered.** It runs in `src/index.tsx` right after `init`.
- **`__esModule` on the provided module.** `@module-federation/vite` before 1.14 treats shared modules as CommonJS. Without the flag it uses the whole namespace as the default export.
- **The root reducer lives in shared** (`rootReducer`, `dynamicMiddleware`), not in `src/features/store.ts`. That lets addons inject into it at import time. The host injects its own slices with `overrideExisting: true` because the root reducer outlives a hot reloaded `store.ts`.
- **Endpoint names are global.** Every addon injects into the same api. `injectEndpoints` with `overrideExisting: false` silently skips a name that is already taken, so the addon ends up calling someone else's endpoint (this happened with `getProjectFolders`). Addons should prefix endpoint and slice names with the addon name.
- **Version skew.** An addon uses whatever the host's shared version exports. If it imports something the host doesn't have yet, that import is `undefined` at runtime. Raise the addon's minimum server version along with its `@ynput/ayon-frontend-shared` range.
- **Existing addons keep working unchanged.** An addon that doesn't declare these shares keeps its bundled copies, its own store and its own providers, the same as before.
- **Federation can't swap a remote once it is registered.** After an addon update the user is asked to refresh (`RemoteModulesProvider`).
