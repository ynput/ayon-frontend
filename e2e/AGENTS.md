# @ynput/ayon-e2e

Playwright end-to-end tests for AYON's web UI: the config, fixtures, a REST client and UI helpers that every
suite needs. ayon-frontend's own suite uses it, and so do addons for the pages and slots they add.
Your suite adds only what is its own: page objects, specs, and the endpoints of its area.

## Set up a suite

```sh
yarn add -D @playwright/test @ynput/ayon-e2e
npx playwright install chromium
```

```ts
// playwright.config.ts
import { ayonConfig } from '@ynput/ayon-e2e/config'

export default ayonConfig(
  // an ayon-frontend checkout to build AYON from (TEST_FRONTEND_DIR overrides it)
  { addon: { name: 'my_addon' }, frontendDir: '../ayon-frontend' },
  { globalTeardown: './tests/e2e/global.teardown.ts' },
)
```

```ts
// tests/e2e/prerequisites.setup.ts
import { checkPrerequisites } from '@ynput/ayon-e2e'
import { test as setup } from '@playwright/test'

setup('the server is ready', ({ baseURL }) => checkPrerequisites(baseURL!))
```

```ts
// tests/e2e/global.teardown.ts
import { ayonTeardown } from '@ynput/ayon-e2e'

export default ayonTeardown()
```

`.env.test.local` next to the config (gitignored) holds the server and an admin account:

```
TEST_BACKEND_URL=http://localhost:5000
TEST_USER_NAME=admin
TEST_USER_PASSWORD=...
```

`ayonConfig(options, ...configs)` gives the shared settings: tests in `tests/e2e`, 2 workers, one retry
(two on CI), traces, screenshots and videos kept on failure, a `setup` project for `*.setup.ts` and a
`chromium` project that depends on it. Later configs are merged in with Playwright's `defineConfig`:
projects by name, `use` key by key, web servers added.

It starts the servers the tests need:
- **AYON's frontend**, built from `frontendDir` (an ayon-frontend checkout) with `vite build` and served with
  `vite preview` on port 3100, proxied to `TEST_BACKEND_URL`. `TEST_DEV_SERVER=1` uses the vite dev server
  (slower with several workers, handy while writing tests). `TEST_SERVER_URL=https://...` tests a running
  frontend and starts nothing.
- **The addon's build** (`addon` option): `ayon-addon dev --ayon` from `@ynput/ayon-addon-dev` on port 5183.
  Every page and signed-in context loads the addon from it instead of the installed version, and users from
  `createUser` get developer mode, which AYON requires for that. The addon's server code is not loaded from
  there: install that version on the server (`checkPrerequisites` says so when it is missing).

Locally a server already listening on those ports is reused, **and not rebuilt**: stop it after changing
app code. `TEST_PORT`, `TEST_ADDON_PORT`, `TEST_WORKERS` change the defaults.

## Write a test

```ts
import { expect, test } from '@ynput/ayon-e2e'

test('a new folder shows in the overview', async ({ page, api, projectName }) => {
  const folder = await api.createFolder(projectName)
  await page.goto(`/projects/${projectName}/overview`)
  await expect(page.getByText(folder.name)).toBeVisible()
})
```

| Fixture | What |
| --- | --- |
| `api` | admin REST client (worker-scoped) |
| `projectName` | a fresh project for this test, deleted after it |
| `createUser(options)` | a user, deleted after the test (`licensed`, `isManager`, `accessGroups`, ...) |
| `accessGroup` | a studio access group with default permissions, deleted after the test |
| `page` | the usual page, without AYON's one-off prompts (and with the addon's dev build) |

Helpers: `uniqueName(label)`, `signInAs(browser, name, password)` (a page as another user, its own
context: close it in a `finally`), `signedInContext(...)`, `apiAs(testInfo, name, password)`,
`addonEndpoint(path)` (`/api/addons/<addon>/<dev version><path>`), and the locators `toast`, `dialog`,
`confirmDialog`, `menuItem`, `formRow`, `switchBody`, `expectRowSelection`.

**Your own endpoints and fixtures.** Extend the client and pass it to `ayonTest`, so `api` and the users'
clients have your methods:

```ts
// tests/e2e/support/api.ts
import { addonEndpoint, AyonApi } from '@ynput/ayon-e2e'

export class Api extends AyonApi {
  async getThing(id: string) {
    return this.get(await addonEndpoint(`/things/${id}`))
  }
}

// tests/e2e/fixtures.ts
import { ayonTest } from '@ynput/ayon-e2e'
import { Api } from './support/api'

export const test = ayonTest(Api).extend<{ thing: string }>({ ... })
export { expect } from '@ynput/ayon-e2e'
```

Fixtures you override (e.g. `createUser`, `context`) replace the package's. `ayonTeardown({ Client, sweep,
beforeDeleteUser })` removes your area's leftovers too.

## Rules

**One test, one user-visible outcome.** Name it after what the user can do.

**Setup through the API, behaviour through the UI.** Create what the test needs with `api`, then do the one
thing the test is about through the UI, the way a user would: clicks, typing, drag and drop. Never call app
internals. Assert the result in the UI **and** through the API (`expect.poll(...)`), so a change that only
looks right in the browser fails.

**Assert what the user sees**: roles, labels, visible values. Not request counts, payload shapes, CSS classes
or inline styles: those break on refactors without a bug. Never `waitForTimeout`; wait for the thing itself.

**Isolation.** Every test works in its own project (`projectName`) and its own users. Every name comes from
`uniqueName()`: `e2e_<runId>_<label>_<worker><n><random>`, unique across tests, workers and parallel runs
by different people. The global teardown deletes what is left of the run's prefix after a crash.
Studio-wide data (access groups, secrets, presets) is shared by every project: name it with `uniqueName()`
and delete it in a `finally`. Never change bundles, addon versions or studio settings.

**Other users.** Tests run as the admin unless they sign in as a user they created. Anything that depends on
who is signed in (their own data, permissions) uses `signInAs` or `apiAs`.

**Page objects.** Locators and multi-step flows live in page objects (`tests/e2e/pages/`), not in specs. Move a
flow into one as soon as a second spec needs it.

**Comments.** Only `FLAG` markers (one line: what is wrong in the app and the workaround) and one-line notes on
deliberately unusual steps.

## Gotchas

- **Worker count.** Each test creates and drops a Postgres schema. With 4 or more workers a local docker
  server stalls: requests take 30 s, redis times out, deletes deadlock. The client retries deadlocks.
- **Pages before projects.** `projectName` closes the test's pages before deleting the project: dropping a
  schema under open queries blocks the database for every other worker.
- **Failed logins ban the IP.** More than 10 wrong-password logins from one IP ban it for 10 minutes,
  locally the admin's too. Keep wrong-password tests to a minimum.
- **Default access groups.** Don't use `artist`, `supervisor`, ...: studios rename or remove them, and the
  server silently drops unknown groups. Use the `accessGroup` fixture:
  `createUser({ accessGroups: { [projectName]: [accessGroup] } })`. A new group is enforced only once the
  server has applied it (it caches them per process): poll `/api/users/{name}/permissions/{project}`.
- **Assignees.** Only licensed users are offered as assignees: `createUser({ licensed: true })`.
- **Dialogs.** `@ynput/ayon-react-components` dialogs are a plain `div.dialog` without `role="dialog"`. Use
  `dialog(page, header)`.
- **Accessible names.** Material icon ligatures are not `aria-hidden`, so a button's name is
  `"<icon> <label>"`, e.g. `"add Create"`. `menuItem(page, label)` handles both menu implementations.
- **Switches and selection.** `InputSwitch` hides its checkbox: click `switchBody(scope)`. primereact
  table rows have no `aria-selected`: use `expectRowSelection`.
- **Transient states.** Saved views and live updates briefly show the old (or a correct-looking) state.
  Before asserting that something is absent, wait for a stable signal: the API has saved it, a reload, or
  other content showing.

## Run

```sh
npx playwright test                         # everything
npx playwright test --ui                    # UI mode
npx playwright show-report                  # the last HTML report
# while writing one spec: no retries, one worker, setup skipped once it ran
npx playwright test --project=chromium --no-deps --workers=1 --retries=0 tests/e2e/<spec>
```

When several runs share one checkout, give each its own `--output=<dir>`, or they delete each other's
`test-results/`. The tests write to the server: use one you are happy to fill with test data, a local
docker server is best.

## Develop this package

It lives in ayon-frontend (`e2e/`). ayon-frontend's tests import its source (tsconfig `paths`); `yarn
build:e2e` builds `dist/` for everyone else. Until it is published, an addon installs it from a linked
checkout with `file:` (not `link:`, which would load a second `@playwright/test`), so after a rebuild the addon
needs `yarn install --check-files`. Changes to the client or the fixtures reach every addon's suite:
keep them generic, and keep an area's endpoints in that area's suite until a second one needs them.
