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
- When a test needs studio-wide state it may not create (no other secrets, no primary preset), it fetches the real response in `page.route` and filters it (`route.fetch()`, then `route.fulfill({ response, json })`), so only the page sees the difference. See `secrets.spec.ts` and `anatomyPresets.spec.ts`.

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

**Comments.** Only `FLAG` markers (one line: what is wrong in the app and the workaround), the note naming the fix PR above a `test.fixme`, and one-line notes on deliberately unusual steps. Explain everything else in the commit message or the PR description.

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

### Areas added in round 2

- **Restricted users** (`permissions/restrictedUser.ts`): `restrictedUser(permissions)` creates a user with fresh access groups on the test project and waits until the server applies them. Access groups are cached per server process and updated from an event, so a brand new group is not enforced right away; poll `/api/users/{name}/permissions/{project}` as the fixture does. Views belong to the user who saves them: call `setWorkingViewColumns` on an `apiAs(...)` client for that user. Manager-only pages redirect a regular user from an effect, after rendering, so give `toHaveURL` about 30 s.
- **Live updates** (`realtime/live.ts`): the production build batches websocket-driven refetches for up to 10 s (a dev build 0.5 s), so allow about 30 s per live assertion and mark tests that wait several times with `test.slow()`. The app subscribes to a topic only after the query that listens to it has loaded, so check the starting state, then `LiveUpdates.expectSubscribed(topic, project)`, then make the change. Events from the page's own `X-Sender` are ignored; the `api` fixture sends none, so its changes count as another client's. Patch one field per call until ynput/ayon-backend#1167 is merged. Folders, tasks, products and versions created elsewhere are deliberately not streamed in (ynput/ayon-frontend#2160): the toolbar's sync button (`syncButton(table)`) highlights with them in its tooltip and syncing shows them; the dashboard has no sync button, there they show after a reload. Changes and deletions still stream. Before asserting that a new entity is not shown, make a later change that the same handler streams (a rename, an assignment, a version status) and wait for it, so the creation has been processed.
- **Viewer and media** (`pages/ViewerPage.ts`, `tests/e2e/media/`): only h264 mp4 with keyframes only comes out `ready` after upload (the committed clips are made that way, see `media/index.ts`). A video opened from a table autoplays muted for 10 s and closes open dropdowns when playback starts, so wait for the pause control before using the viewer's details panel. Frames are 1-based; the video time is `(frame - 1) / fps`. Assert the video's actual time (`expectFrame`), not the frame field, and wait for each frame step before the next key.
- **Page health** (`support/pageHealth.ts`, `smoke/`): `watchPageHealth(page)` collects page errors, `console.error`, failed `/api` and `/graphql` calls and the app's error screens; `KNOWN_NOISE` is the allowlist, keep it tiny and justified. Smoke tests share one read-only, worker-scoped project (`smokeFixtures.ts`) instead of creating one per test. `/api/connect/*` goes to Ynput Cloud and can take over 30 s: never wait for it.
- **Overview power features:** the "Search and filter" placeholder disappears once a chip exists, so click `.search-filter` for the textbox; its options are plain `li` items. Copy and paste need `context.grantPermissions(['clipboard-read', 'clipboard-write'])`, and copying is async: poll `navigator.clipboard.readText()` before pasting. Date cells open the native picker: fill the `input[type=date]` and click another cell (`setDateCell`). Root folders are not sorted by name, so don't assert row order unless the test sorts. Deleting several entities asks for counts (`confirmDeleteCounts`).
- **Activity feed:** `.comment` also matches the comment box's submit button, so count comments with `.feed li.comment`. Commenting makes the author a watcher, so watch tests must not seed admin comments first. The watcher picker lists licensed users only. `version.publish` activities come from a server event and their order varies; GraphQL `activities(last: N)` is newest first.
- **Settings editor lists** (anatomy statuses, types, ...) are addressed by index (`root_statuses_<i>_name`); get it from the API (anatomy order), new items go last. Text fields and color pickers commit on blur (`fillText`, `setColor`), and `setOptions` selects exactly the given options of a multi-select. Names must not exist in the default anatomy already (e.g. "Matchmove"), or the save fails. Removing a status or type that is in use is refused (409) and nothing is saved.
- **Unit tests** (`tests/unit/`) are transpiled to CommonJS: use static imports only. They can import pure modules (single files under `shared/src/util/`, not its index; `ProjectTreeTable/utils/*`; MarkdownEditor `markdown/plainText`, `links/*`, `media/mediaUtils`). They cannot import anything that loads `@ynput/ayon-react-components` at runtime or reaches `@shared/api` (its client reads `window.location` on import). `yarn test-typecheck` does not cover `tests/unit`. Run them without the app build: `TEST_SERVER_URL=http://localhost:3100 npx playwright test --project=unit`. To render a component, use `renderToHtml` (`tests/unit/support/render.ts`): Playwright compiles JSX to its own element objects, which React can't render as they are.


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
- ynput/ayon-frontend#2400: the secrets page showed a "0" when there were no stored secrets (`secrets.spec.ts`).
- ynput/ayon-frontend#2401: "Set as primary" stayed enabled for the built-in anatomy preset while it was primary (`anatomyPresets.spec.ts`).
- ynput/ayon-frontend#2402: right-clicking a user that was not selected in the teams users table acted on the previous selection (`teams.spec.ts`).

Found in round 2, also fixed in separate PRs (the tests are `test.fixme` with a note naming the PR):
- Permissions: the details panel ignored attribute read/write permissions (ynput/ayon-frontend#2403); the overview treated "no field may be written" as unrestricted (#2404); opening a project without access could end on a blank page (#2405); custom read-only attributes lost their lock on product and version lists (#2411).
- Viewer: Shift+A/Shift+D also switched the version (#2406); "Approved" was always "None" (#2407); a version with nothing playable showed a blank viewer (#2408); pausing right after a video loaded kept the play button on "pause" (#2409).
- Overview and lists: arrow keys and Tab landed on hidden columns (#2415); CSV imports showed only after a reload (#2416).
- Live updates: after visiting a project the websocket stayed limited to that project (#2414); folders, tasks and versions created elsewhere were streamed in (or, for overview tasks, silently dropped) and the sync button never highlighted for them (#2423).
- Text: plain-text summaries mangled escaped markers and link urls with parentheses (#2410).
- Pages: unknown URLs showed an empty page instead of the 404 page (#2417); task progress and workfiles sometimes requested project "null" (#2418); the reviews page could crash while the review addon cards loaded (#2419); the users assignee query failed inside addon stores (#2420).
- Backend (ynput/ayon-backend): deleting or renaming a project broke other users' inbox and kanban and could deadlock the delete (#1164); access groups lost all but one group's writable fields (#1165); hidden sibling tasks were readable through REST (#1166); one update changing several fields sent the last value in every event (#1167); edited-out mentions stayed (#1168); the cached folder list kept old inherited attributes after a project save (#1169); statuses added in the anatomy editor got an empty scope (#1170); list items added at position 0 went last (#1171); lists shared as Editor with an access group or team could not be edited (#1172); a new project could be missing from the cached project list (#1173).

Still open (worked around in the tests, marked with `FLAG` in the code):
- `@ynput/ayon-react-components`: `Dialog` has no `role="dialog"` or accessible name, `FormRow` labels are not associated with their inputs, and icon ligature text is not `aria-hidden`.
- New list dialog: `<label for="entityType">` points at an element that does not exist.
- Users, team and access group forms: labels are not associated with their inputs.
- Backend: project deletes racing cross-project reads (inbox, kanban) fail or deadlock until ynput/ayon-backend#1164 is merged; keep the default of 2 workers until then.
- With focus on a hierarchy slicer row, Shift+R renames the folder instead of syncing (`useRowKeydown`); focus the grid before pressing it.
- `checkColumnVisibility` prefix-matches plain column ids (`tests/unit/columnVisibility.spec.ts`); a fix must also change the callers that pass `'link_'`.
- Review addon 0.7.5: opening an empty review session crashes the app; planner addon 2.3.0: the schedule of a new project gets 500s. Both are addon bugs (separate repos).
- Backend: uploaded files of deleted projects are only moved to `.trash` folders, which are never purged.
- Backend (planner addon 2.3.1-dev): `handle_user_created` re-syncs every user and fails with a unique violation when two users are created at the same time.

Tests retry once locally (twice on CI) to ride out these backend hiccups. A test that passes on retry is reported as **flaky**. Look into it rather than ignoring it.
