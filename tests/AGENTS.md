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

The config, fixtures, REST client and UI helpers come from `@ynput/ayon-e2e` (`e2e/`, imported from source through tsconfig `paths`). Its guide, [e2e/AGENTS.md](../e2e/AGENTS.md), covers the servers Playwright starts (`TEST_DEV_SERVER`, `TEST_SERVER_URL`, `TEST_WORKERS`), the fixtures and the rules every suite follows. Read it first; this file only adds what is specific to the frontend's suite.

While writing tests, run only your specs: `npx playwright test --project=chromium --no-deps --workers=1 --retries=0 tests/e2e/<area>`. `--no-deps` skips the login setup once `playwright/.auth/admin.json` exists.

## When to add a test

A test is cheaper than someone finding the bug or checking it by hand, so add them. What matters is that each one stays cheap to run and to keep working.

**Add an e2e test for**
- a main user flow of a page or feature: create, edit, delete, save, share.
- a critical path, where a regression loses or corrupts data or opens access: saving settings, permissions, deletes, imports.
- every bug fix: reproduce the bug, so it can't come back unnoticed. A fixed bug is a regression test, not an edge case.

**Keep each test cheap**
- Prefer extending over adding. Add an assertion to an existing spec that already walks through that flow, instead of a new spec with its own setup.
- Set up only what the test needs through the API. Avoid creating 100+ entities, admins or bundles on every run.
- Assert what the user sees, not implementation details: request counts, batch sizes, payload shapes, inline styles or colours. Those break on refactors without a real bug.
- Cover variants of one behaviour (e.g. search syntaxes) in one spec, not one spec each.

**Tests written while working.** Agents may write tests to check their own change. Keep the ones that meet the points above, rework or remove the rest before opening the PR.

**Agent bug fix flow.** Tests are meant to run on every PR in CI, so a reported bug can be handled mostly unattended:
1. One agent writes a test that fails because of the bug. It confirms the bug, or the agent comments on the issue that it can't reproduce it.
2. A different agent writes the fix that makes the test pass. The agent that fixes must not write or change the test, or it grades its own work.
3. The fix stays as small as the bug needs. Don't bend the code around the test when a one-line change fixes it.
4. The PR carries the test and the fix together. The reviewer checks first that the test makes sense, really reproduces the bug, and passes.

Prefer e2e over unit for these: they cover what the user hit. CI runs the whole suite, not a subset picked by the PR's area, because a change can break code it didn't mean to touch. Some features can't run in headless Chromium yet (e.g. WebCodecs playback in Review); cover what can run and leave the rest to manual testing.

## How the e2e tests are built

**Scope.** Only the frontend's own pages. Addon pages (planner, review, reports and other addons) are tested in their addons' repos, so don't add tests for them here.

**What lives where.**
- `@ynput/ayon-e2e`: everything an addon's suite needs too. The `projectName`, `createUser`, `accessGroup` and `page` fixtures, `uniqueName()`, `signInAs`, `apiAs`, the generic locators (`toast`, `dialog`, `confirmDialog`, `menuItem`, `formRow`, `switchBody`, `expectRowSelection`) and the REST client for projects, folders, tasks, products, versions, users and access groups.
- `support/api.ts`: `AyonApi` extends the package's client with the frontend's own areas (anatomy, representations, reviewables, activities, addon settings, lists, views, inbox, teams, secrets, presets). `fixtures.ts` passes it to `ayonTest`, so `api` has them. Add an endpoint here unless an addon's suite needs it too.
- `global.teardown.ts`: the package's teardown, plus the run's secrets and anatomy presets.
- Page objects live in `pages/`, e.g. `OverviewPage.createFolder()`, `DetailsPanel.addComment()` and `ProjectsList.select()`.

**Studio-wide data.** Never make a preset primary or change the attribute library. When a test needs studio-wide state it may not create (no other secrets, no primary preset), it fetches the real response in `page.route` and filters it (`route.fetch()`, then `route.fulfill({ response, json })`), so only the page sees the difference. See `secrets.spec.ts` and `anatomyPresets.spec.ts`.

**Other users.** Anything that changes the signed-in user (profile, password, sign out) or depends on whose data is shown (inbox, my tasks) signs in as a user the test creates. `AyonApi.login` inside a test acts as the admin unless it goes through `apiAs`: the admin's `accessToken` cookie beats the `Authorization` header.

**Comments.** Besides `FLAG` markers, the note naming the fix PR above a `test.fixme`. Explain everything else in the commit message or the PR description.

## Gotchas

The generic ones (workers, teardown order, failed logins, access groups, dialogs, accessible names, switches, transient states) are in [e2e/AGENTS.md](../e2e/AGENTS.md).

- **Two menus.** Project pages have a second `more_horiz` button in the top nav that opens the "Project Context" debug dialog. Scope generic buttons to the panel you mean.
- **Per-user views.** Views (columns, grouping, filters) are stored on the server per user and project. Fresh projects use the default view, e.g. the products page lists one row per version.
- **Cross-project queries.** A manager's or admin's inbox reads every project. It fails while another worker is creating or dropping a project. Give inbox users access to the test project only, not `isManager`.
- **Edit only after selecting.** Task progress cells only become editable once selected (`.tag.status.editable`). On the dashboard, clicking a card selects it and clicking its title opens the details panel.
- **New entity dialog.** The dialog opens its type dropdown by itself about 180 ms after it appears. `OverviewPage.fillCreateDialog` waits for that rather than racing it with a click.
- **Overview columns.** The default view hides most attributes. Show one for setup with `api.setWorkingViewColumns(...)`. A header's accessible name changes on hover, so use `OverviewPage.columnHeader(id)`. Enter in a text cell saves and starts editing the next row (`editTextCell` presses Escape afterwards).
- **Escape in the overview details panel** also reaches the table, which clears the selection and closes the panel. Close dropdowns there by clicking outside.
- **Settings editor** (anatomy, access groups, addon settings): expand a section with its chevron (`.panel-toggler`), not the header. Field labels are not linked to inputs, so use `[data-schema-id="root_..."]`. Number fields commit on blur.
- **Not tested on purpose.** "Set username" renames the user in every project schema in one transaction, the same concurrency hazard as project create/delete.

### Areas added in round 2

- **Restricted users** (`permissions/restrictedUser.ts`): `restrictedUser(permissions)` creates a user with fresh access groups on the test project and waits until the server applies them. Access groups are cached per server process and updated from an event, so a brand new group is not enforced right away; poll `/api/users/{name}/permissions/{project}` as the fixture does. Views belong to the user who saves them: call `setWorkingViewColumns` on an `apiAs(...)` client for that user. Manager-only pages redirect a regular user from an effect, after rendering, so give `toHaveURL` about 30 s.
- **Live updates** (`realtime/live.ts`): the production build batches websocket-driven refetches for up to 10 s (a dev build 0.5 s), so allow about 30 s per live assertion and mark tests that wait several times with `test.slow()`. The app subscribes to a topic only after the query that listens to it has loaded, so check the starting state, then `LiveUpdates.expectSubscribed(topic, project)`, then make the change. Events from the page's own `X-Sender` are ignored; the `api` fixture sends none, so its changes count as another client's. Patch one field per call until ynput/ayon-backend#1167 is merged. Folders, tasks, products and versions created elsewhere are deliberately not streamed in (ynput/ayon-frontend#2160): the toolbar's sync button (`syncButton(table)`) highlights with them in its tooltip and syncing shows them; the dashboard has no sync button, there they show after a reload. Changes and deletions still stream. Before asserting that a new entity is not shown, make a later change that the same handler streams (a rename, an assignment, a version status) and wait for it, so the creation has been processed.
- **Viewer and media** (`pages/ViewerPage.ts`, `tests/e2e/media/`): only h264 mp4 with keyframes only comes out `ready` after upload (the committed clips are made that way, see `media/index.ts`). A video opened from a table autoplays muted for 10 s and closes open dropdowns when playback starts, so wait for the pause control before using the viewer's details panel. Frames are 1-based; the video time is `(frame - 1) / fps`. Assert the video's actual time (`expectFrame`), not the frame field, and wait for each frame step before the next key.
- **Page health** (`support/pageHealth.ts`, `smoke/`): `watchPageHealth(page)` collects page errors, `console.error`, failed `/api` and `/graphql` calls and the app's error screens; `KNOWN_NOISE` is the allowlist, keep it tiny and justified. Smoke tests share one read-only, worker-scoped project (`smokeFixtures.ts`) instead of creating one per test. `/api/connect/*` goes to Ynput Cloud and can take over 30 s: never wait for it.
- **Overview power features:** the "Search and filter" placeholder disappears once a chip exists, so click `.search-filter` for the textbox; its options are plain `li` items. `SearchFilterBar` (`pages/SearchFilterBar.ts`) wraps this for the overview and products pages; a free text value (`addText`) is typed into the new chip, not into the dropdown. Copy and paste need `context.grantPermissions(['clipboard-read', 'clipboard-write'])`, and copying is async: poll `navigator.clipboard.readText()` before pasting. Date cells open the native picker: fill the `input[type=date]` and click another cell (`setDateCell`). Root folders are not sorted by name, so don't assert row order unless the test sorts. Deleting several entities asks for counts (`confirmDeleteCounts`).
- **Summary footer** (`support/summary.ts`, `overview/summaries.spec.ts`, `products/summaries.spec.ts`): the footer under the overview and products tables is a power-pack feature. Its count must match the table data: every folder and task in the filtered table, including parents of matches and rows inside collapsed folders, so expand everything (`expandAllRows`) before counting rows. Task and version lists show no folder or product rows, and their footer counts only tasks or versions. Filters are set through the saved view with the same JSON the filter bar writes: one folder name is a single `like` condition, a list of names is a nested `or` group. Keep the seeded trees small: the table is virtualised and only renders the rows on screen.
- **Activity feed:** `.comment` also matches the comment box's submit button, so count comments with `.feed li.comment`. Commenting makes the author a watcher, so watch tests must not seed admin comments first. The watcher picker lists licensed users only. `version.publish` activities come from a server event and their order varies; GraphQL `activities(last: N)` is newest first.
- **Settings editor lists** (anatomy statuses, types, ...) are addressed by index (`root_statuses_<i>_name`); get it from the API (anatomy order), new items go last. Text fields and color pickers commit on blur (`fillText`, `setColor`), and `setOptions` selects exactly the given options of a multi-select. Names must not exist in the default anatomy already (e.g. "Matchmove"), or the save fails. Removing a status or type that is in use is refused (409) and nothing is saved.
- **Addon features** (`support/addons.ts`): `requireAddon(api, name, { license, minVersion })` skips the test unless the addon is in the production bundle, and optionally licensed (from `/api/info` `extras`) and recent enough. The reason shows in the report as a skip, never as a pass. It works in a test, `beforeEach` or a fixture.
- **Comment categories** (`feed/categories/`, Power Pack): categories are the Power Pack `activity_categories` setting. Tests only save them in the test project's settings (`setCategories`), never in studio settings. The server caches the resolved list in redis until `settings.changed`, so `setCategories` waits for it. `/activityCategories` reports 30, not 20, for every category a user may post in (admins and managers included); the highest level of `__everyone__`, the user, their groups and their teams wins. The "Edit Access" dialog only offers licensed users (`restrictedUser({}, { licensed: true })`), and its search results re-render while they settle, so pick with Enter. A feed filter set that was used before is cached and not refetched; a test that waits for the refetch needs a new set at each step. The category filter chip reopens as a multi-select that applies on Confirm.
- **Filter states** (`support/filterStates.ts`): one seeded project (`seedFilterData`) and, per page, a varied set of filter states (bar fields, parent scopes, attributes, AND/OR groups, excludes, global search, the hierarchy slicer, latest per folder...) with the rows each leaves. `applyFilterState` saves the working view, selects slicer folders (session storage, not the view) and types a search. Use it for any test that needs tables in filtered states (`tableExport/filteredExport.spec.ts`); add a state rather than seeding a new dataset, and keep it a spread of kinds, not every field. Saved filter keys are `<scope>_<field>` on pages with several scopes, `entity_<field>` / `attrib.<name>` on lists.
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
- ynput/ayon-backend#1190: the products resolver had no representation filter, so "Show products" could not narrow product rows by representation (`representationFilter.spec.ts`). Until a server has it, the products query is rejected and "Show products" lists nothing.

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
- Backend: uploaded files of deleted projects are only moved to `.trash` folders, which are never purged.
- Backend (planner addon 2.3.1-dev): `handle_user_created` re-syncs every user and fails with a unique violation when two users are created at the same time.

Tests retry once locally (twice on CI) to ride out these backend hiccups. A test that passes on retry is reported as **flaky**. Look into it rather than ignoring it.
