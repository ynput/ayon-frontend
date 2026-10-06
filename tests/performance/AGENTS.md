# Page load benchmarks

Playwright benchmarks that hard-load the major routes and record how long it takes until each one
shows real content. Use them to check that a change makes loading faster (or at least not slower).

## Running

1. Have an AYON server with data. `SERVER_URL` (from `.env.local`) is where `vite preview` and
   `vite` proxy `/api`, `/graphql` and `/addons` to. A local server gives steadier numbers.
2. Credentials: `NAME` / `PASSWORD` (as in `.env.local`), or `PERF_TOKEN`. `globalSetup.ts` logs in
   through the API and stores the token like the app does (localStorage + cookie).
3. Build and run:

```bash
yarn perf:build
```

`yarn perf` runs without building (it serves the existing `dist/`). Compare two runs with
`yarn perf:compare perf-results/<before>.json [perf-results/<after>.json]`.

Settings (env vars):

| Var | Default | |
| --- | --- | --- |
| `PERF_MODE` | `preview` | `preview` serves `dist/` (production build), `dev` runs the vite dev server |
| `PERF_BASE_URL` | | measure an already running app instead (another build, a deployed server) |
| `PERF_RUNS` | 5 | recorded loads per route (plus one unrecorded warm up load) |
| `PERF_ROUTES` | all | comma separated route names from `routes.ts` |
| `PERF_LATENCY` | 0 | extra ms per request (Chrome network emulation), to mimic a remote server |
| `PERF_CPU` | 1 | CPU slowdown factor |
| `PERF_PROJECT` / `PERF_LISTS_PROJECT` | `demo_Big_Feature` / `demo_Commercial` | projects the project routes use |
| `PERF_LABEL` | `run` | name of the result file |
| `PERF_CHANNEL` | | e.g. `chrome` to use the installed Chrome when Playwright's Chromium isn't installed |
| `PERF_DEBUG` | | save a screenshot of each route |

Results go to `perf-results/` (git ignored): `<label>-<date>.json` and `latest.json`, with every
sample and the API requests that finished before the page was ready, for waterfall analysis.

## What is measured

Each recorded run does a **cold** load (new browser context: empty HTTP cache and localStorage,
like a first visit) and then a **warm** load (hard reload of the same page: cached JS, filled
localStorage). Times are ms since navigation start, medians over the runs.

- **shell**: the full page loader (`LoadingPage`, marked with `data-loading-page`) is gone for good
  and the app has rendered.
- **ready**: all `ready` selectors of the route are visible, there is no full page loader and no
  visible `.loading` shimmer, and this held for `PERF_SETTLE_MS` (300). Thumbnail shimmers don't
  count: they are images from the server that load after the content.

A load that never becomes ready (30 s) fails the route's test with a screenshot in `perf-results/`.

## Contracts and gotchas

- `LoadingPage` must keep its `data-loading-page` attribute; any new full page loader should use
  `LoadingPage` so it counts as loading.
- `ready` selectors must only match real content (not skeletons). Prefer ids and data attributes
  over class names: styled-components class names change between builds.
- Thumbnail shimmers are excluded via `.thumbnail`; if a page shows another kind of image
  placeholder with `.loading`, it counts as loading.
- Measurements compete for CPU, so tests run one at a time. Close other heavy apps for stable
  numbers and compare runs made on the same machine and server.
- To compare branches, build each into its own folder, serve it with
  `yarn vite preview --outDir <folder> --port <port>` and point `PERF_BASE_URL` at it.
