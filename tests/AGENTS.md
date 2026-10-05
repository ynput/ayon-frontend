# Tests

Playwright runs two kinds of tests:

| Project | Folder | What it is |
| --- | --- | --- |
| `unit` | `tests/unit` | Pure logic tests. No browser, no server. |
| `chromium` | `tests/e2e` | End-to-end tests against a real AYON server. Depends on `setup` (`auth.setup.ts`). |

## Running

1. You need a running AYON server you are happy to write test data to. A local docker server is best.
2. Create `.env.test.local` in the repo root. It is gitignored.
   ```
   TEST_BACKEND_URL=http://localhost:5000
   TEST_USER_NAME=admin
   TEST_USER_PASSWORD=...
   ```
   The user must be an admin. `NAME` and `PASSWORD` from `.env.local` are used as a fallback.
3. Run the suite:
   - `yarn test`: everything
   - `yarn test:unit`: unit tests only
   - `yarn test:e2e`: e2e tests only
   - `yarn test-ui`: Playwright UI mode
   - `yarn test-report`: open the last HTML report

Playwright starts its own frontend on port 3100. By default it builds the app (`vite build` into `dist-e2e/`) and serves it with `vite preview`. The preview server uses the same `/api` proxy as the dev server.
- `TEST_DEV_SERVER=1` uses the vite dev server instead. Use it while writing tests. It is too slow for several workers, because every page load fetches hundreds of unbundled modules.
- `TEST_SERVER_URL=https://...` skips the local server and tests an already running frontend.
- `TEST_WORKERS=n` changes the number of workers (default 2, see below).

If a test server is already listening on 3100 it is reused locally. **It will not be rebuilt**, so stop it after changing app code.

While writing tests, run only your specs: `npx playwright test --project=chromium --no-deps --workers=1 --retries=0 tests/e2e/<area>`. `--no-deps` skips the login setup once `playwright/.auth/admin.json` exists. When several runs share one checkout, give each its own `--output=<dir>`, or they delete each other's `test-results/`.

## How the e2e tests are built

**Isolation.** Every test gets its own project from the `projectName` fixture (`fixtures.ts`).
- The project is created through the API before the test and deleted after it, so tests never see each other's data.
- Users from the `createUser` fixture and the group from the `accessGroup` fixture are deleted after the test.
- Every name comes from `uniqueName()` (`support/names.ts`). The format is `e2e_<runId>_<label>_<worker><n><random>`, which makes names unique across tests, workers and parallel runs by different people.
- `global.teardown.ts` deletes anything left over from the current run's prefix, for example after a crashed worker: projects, users, access groups, secrets and anatomy presets.
- Studio-wide data (secrets, anatomy presets, access groups) is shared by every project. Always name it with `uniqueName()` and delete it in a `finally`. Never make a preset primary or change bundles, addons, studio settings or the attribute library.

**Other users.** The suite runs as an admin. Anything that changes the signed-in user (profile, password, sign out) or depends on whose data is shown (inbox, my tasks) signs in as a user the test creates:
- `signInAs(browser, name, password)` (`support/session.ts`) opens a separate signed-in browser context. Close it in a `finally`.
- `apiAs(testInfo, name, password)` is a REST client for that user. `AyonApi.login` inside a test always acts as the admin, because the request context inherits the admin's `accessToken` cookie and the server prefers the cookie over the `Authorization` header.

**Setup through the API, behaviour through the UI.**
- `support/api.ts` creates the data a test needs: projects, folders, tasks, products, versions, comments, lists, teams, users and access groups.
- The test then does the one thing it is testing through the UI, the way a user would: real clicks, typing and drag and drop. It never calls app internals.
- Assert the result in the UI **and** through the API (`expect.poll(...)`), so a change that only looks right in the browser fails the test.

**Shared UI helpers.**
- Page objects live in `pages/`, e.g. `OverviewPage.createFolder()`, `DetailsPanel.addComment()` and `ProjectsList.select()`.
- Generic locators are in `support/ui.ts`: `toast`, `dialog`, `confirmDialog` and `menuItem`.
- Reuse these instead of writing selectors in specs. When a flow is needed in a second spec, move it into a page object.

**Popups.** The `page` fixture marks one-off prompts as already dismissed, using the same storage keys the prompts set themselves. This covers "Complete your profile", the restart banner and the release installer prompt. It also blocks featurebase.

## Gotchas

- **Fixture teardown order.** The `projectName` fixture closes the test's pages before deleting the project. Dropping a project schema while the page is still querying it blocks the database for every other worker.
- **Worker count.** Each test creates and drops a Postgres schema. With 4 or more workers, a local docker server stalls: requests take 30 s, redis times out and deletes occasionally deadlock. `deleteProject` retries on deadlocks.
- **Dialogs.** `@ynput/ayon-react-components` dialogs are a plain `div.dialog` without `role="dialog"`. Use `dialog(page, header)`.
- **Accessible names.** Material icon ligatures are not `aria-hidden`, so a button's name is `"<icon> <label>"`, e.g. `"add Create"`. Use `menuItem(page, label)` for menus. It handles both the primereact context menu and the shared `Menu`.
- **Two menus.** Project pages have a second `more_horiz` button in the top nav that opens the "Project Context" debug dialog. Scope generic buttons to the panel you mean.
- **Per-user views.** Views (columns, grouping, filters) are stored on the server per user and project. Fresh projects use the default view, e.g. the products page lists one row per version.
- **Assignees.** Only licensed users are offered as assignees. Use `createUser({ licensed: true })`.
- **Access groups.** Do not use the default groups (`artist`, `supervisor`, ...). Studios rename or remove them, and the server silently drops unknown groups from a user, leaving them without project access. Use the `accessGroup` fixture: `createUser({ accessGroups: { [projectName]: [accessGroup] } })`.
- **Cross-project queries.** A manager's or admin's inbox reads every project. It fails while another worker is creating or dropping a project. Give inbox users access to the test project only, not `isManager`.
- **Edit only after selecting.** Task progress cells only become editable once selected (`.tag.status.editable`). On the dashboard, clicking a card selects it and clicking its title opens the details panel.
- **New entity dialog.** The dialog opens its type dropdown by itself about 180 ms after it appears. `OverviewPage.fillCreateDialog` waits for that rather than racing it with a click.
- **Failed logins ban the IP.** More than 10 wrong-password logins from one IP ban it for 10 minutes. Locally that is also the admin's IP, so the whole suite would fail. Keep wrong-password tests to a minimum. ("User is not active" does not count.)
- **Overview columns.** The default view hides most attributes. Show one for setup with `api.setWorkingViewColumns(...)`. A header's accessible name changes on hover, so use `OverviewPage.columnHeader(id)`. Enter in a text cell saves and starts editing the next row (`editTextCell` presses Escape afterwards).
- **Escape in the overview details panel** also reaches the table, which clears the selection and closes the panel. Close dropdowns there by clicking outside.
- **Settings editor** (anatomy, access groups, addon settings): expand a section with its chevron (`.panel-toggler`), not the header. Field labels are not linked to inputs, so use `[data-schema-id="root_..."]`. Number fields commit on blur.
- **Switches and selection.** `InputSwitch` hides its checkbox, so click `switchBody(scope)` (`support/ui.ts`). primereact table rows have no `aria-selected`; selection is the `p-highlight` class.
- **Transient states.** Saved views and feed filters briefly show the old (or a correct-looking) state. Before asserting that something is absent, wait for a stable signal: the API has saved it, a reload, or other content showing.
- **Not tested on purpose.** "Set username" renames the user in every project schema in one transaction, the same concurrency hazard as project create/delete.

## Known issues found while writing the suite

Fixed in the same change:
- `features/user.js`: `action.payloadaccessToken` typo set `Authorization: Bearer undefined` after a fresh login.
- Signing out sometimes left the user signed in. The logout redirect could cancel the logout request, and the `accessToken` cookie was never cleared (`services/auth/logout.ts`, `features/user.js`).
- Creating a folder from the overview "Create" button did not expand the selected parent, because `ProjectNewEntityHost` only used context-menu parents. The unused `useExpandAndSelectNewFolders` hook was removed.
- One rename (name and label) was stored as two undo steps, so a single undo only reverted the label (`RenameForm`).
- Right-clicking a user or a team that was not selected opened a menu built from the previous selection. Users: "Delete selected", "Set password" and "Set username" were disabled. Teams: "Delete Team" deleted nothing. The team context menu also selected a string instead of an array.
- The lists panel hid the primary "Create list" button at its default width but kept the secondary "Create folder" button.
- Form labels were not linked to their inputs in the new project dialog (`LabelWithNameField`) and in the new folder/task dialog (`NewEntityForm`).

Fixed in separate PRs. The covering tests are `test.fixme` until these are merged:
- ynput/ayon-frontend#2396: "Items count" in the list details was always 0 (`lists.spec.ts`).
- ynput/ayon-frontend#2397: the anatomy preset rename dialog did not show the current name (`anatomyPresets.spec.ts`).
- ynput/ayon-frontend#2398: just viewing project anatomy marked it as changed (`projectsManager.spec.ts`).
- ynput/ayon-frontend#2399: the first column change in a project reordered the other columns (`tableView.spec.ts`).

Still open (worked around in the tests, marked with `FLAG` in the code):
- `@ynput/ayon-react-components`: `Dialog` has no `role="dialog"` or accessible name, `FormRow` labels are not associated with their inputs, and icon ligature text is not `aria-hidden`.
- New list dialog: `<label for="entityType">` points at an element that does not exist.
- Users, team and access group forms: labels are not associated with their inputs.
- Backend: concurrent project create/delete stalls the server and can deadlock `DELETE /api/projects/{name}`.
- Backend: `get_user_inbox` loops over every project for managers and admins. If one project's schema is missing (being created or deleted), the whole inbox fails with `relation "project_<name>.activity_feed" does not exist`.
- Backend (planner addon 2.3.1-dev): `handle_user_created` re-syncs every user and fails with a unique violation when two users are created at the same time.

Tests retry once locally (twice on CI) to ride out these backend hiccups. A test that passes on retry is reported as **flaky**. Look into it rather than ignoring it.
