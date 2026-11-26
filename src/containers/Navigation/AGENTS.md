# Navigation: sidebar, tab rows and where addon pages go

Spec: AYON-20261125-001 (variant B). A context is a project (`/projects/<name>/…`) or Home (every
other page). Its sidebar lists places; the selected place owns the tab row.

## How it fits together

- **One registry.** `useProjectNavigation`, `useStudioNavigation` and `useSettingsNavigation` build
  `NavItem`s from the sources the pages render from (core modules, the addon pages AYON reserves,
  legacy keyword remotes, `project.page` / `studio.page` contributions, classic iframe addons,
  settings sub-pages). The pages call the same hooks, so a tab and its page always agree.
- **The sidebar** (`NavRail`) is mounted once in `app.tsx`, beside `AppRoutes`, inside
  `.app-body` / `.app-page`. Pages still render their own `AppNavLinks`: the project page and Home
  with only the active item's tabs (`findActiveItem` by path), Studio settings with the Settings
  item's tabs, and the Project manager, Inbox and Account with rows they build themselves. The views
  button portals into the tab and the tab row's access redirect keys on `useParams().module`, so the
  row can't move into a shared shell.
- **The admin area** (`AdminDock`) closes every sidebar: the admin pages (`useAdminNavigation`:
  Settings, Projects, Events, Services, Market) as smaller items, and an Admin menu (`AppMenu`, the
  old apps menu) with the ones not shown as items and the server's actions (Update pipeline,
  Restart, Ynput Cloud). `splitAdminItems` decides which are items, in their order:
  `NavLayout.promoted`, else `DEFAULT_PROMOTED`. Menu id `app` is the one the `/appMenu` redirect
  (Ynput Cloud sign-in) reopens.
- **When the sidebar is too short** nothing scrolls (Milan, 2026-11-25). The admin area gives way
  first: `NavRail` hands it the height its items leave (`footer(space)`), and it keeps the pages
  that fit, top down (`fitDocked`, counting the Admin button that then shows); the rest go into
  the Admin menu. Only when it is down to the Admin button do the items fold into More, from the
  last one. While a layout is edited nothing folds and the sidebar scrolls.
- **Pinned views** (`layouts/`, behind the Power Pack licence): a saved Overview, Products, Lists or
  Review view (`PINNED_PAGES`: pages that read the host's views context) pinned from the views menu (`ViewPinsProvider`, the pin on a saved view's row) becomes a tab
  right after its page's tab, in whichever sidebar item holds it (`placePinnedTabs`), linking to
  `…/<page>?view=<id>`. The page then runs on the same `ViewsProvider`, controlled (`PageViews`,
  `usePinnedViewSettings`): it never selects the view or writes the working view; changes
  are a draft per view in session storage (`pinned-view-drafts`, the dot on the tab) until Save
  changes, Save as new or Revert in the tab's menu (`PinnedTabMenu`, also on right-click).
  The pages a view pins from lead their tab with that page's icon; a pinned tab is quieter, its
  name lighter and the same icon smaller, so it still says which page it opens wherever it is
  moved (Milan, 2026-11-26).
- **Addon routes** (`Route` keyword modules: review and storyboard sessions) add `addon-route` to
  `#root`: the sidebar hides and the wrappers are `display: contents`, so the page lays out as before
  the sidebar existed. The review player is `position: fixed` without offsets: it relies on that.

## Contracts

- **Item ids are stable** and are what layouts refer to: a core module key
  (`production`, `reviews`, `workfiles`), `addon:<addon>/<page id>`, `group:<addon>/<group>`,
  `remote:<module>`, `classic:<addon>`. Don't derive them from labels or positions.
- **`filterNavigation` is the only filter** over the registry: access and the layout's hidden ids.
  Layouts plug in through `NavLayout` there and in
  `splitAdminItems` (which admin pages are promoted from the Admin menu), nowhere else. It
  decides which items show; tabs keep their `accessLevels`, so the tab row can still redirect from a
  tab the user can't open.
- **Page placement** (`addon/src/scopes.ts` `PageMeta`): `placement`, `icon`, `section`, `group`,
  `groupTitle`, `order`. What a page declares wins; `knownPages.ts` places known addons that don't
  declare yet; anything else is `other` with the `extension` icon. `placement: 'tab'` puts the page
  in the first item (Production, My work).
- **Sidebar order:** `NAV_SECTIONS`, then `order`, then registry order, a divider between
  sections; until a layout arranges it.
- **Layouts are views of type `layout`** (behind the Power Pack licence). Their settings
  (`layouts/types.ts`): per context (`project`, `studio`) the sidebar's `items` (order, hidden,
  and `free` once the user arranged it: then `order` is the whole sidebar, items and their
  `divider:<id>` dividers) and
  each item's `tabs` (order, hidden; a tab is its module or `view:<id>`) and `pinned` views, plus
  the `promoted` admin pages.
- **Which layout applies** (`useActiveLayout`, `resolveLayout`): the one the user picked (user
  preferences, `navigationLayout`), else the project's default (project data, same key), else the
  studio default (the `layout` base view, also when it is picked or a project's default), else the
  user's own layout (their working view), else none. A picked or project layout the user can't
  read (not in their list) is skipped. `ready` says every lookup that decides it has answered.
- **The layout menu** (`LayoutMenuHost` in the header, before the icons) is Power Pack's
  `views/LayoutMenu`; a Power Pack that doesn't list it shows nothing. Core hands it
  `LayoutMenuProps` (`useLayoutMenu`): the readable layouts, which applies here, the pick, the
  project and studio defaults, and the actions that change them (`pick`, `null` to follow the
  defaults; `setProjectDefault` for managers, project data; `setStudioDefault` for admins, which
  copies the layout into the base view). Core reports how they went (toasts). Save as new,
  sharing, renaming and deleting are the views API's, in the menu's own dialog. Keep the type in
  step with its copy in Power Pack (`frontend/modules/views/src/layouts/types.ts`).
- **Changing it** (pins, edit mode) waits for `ready`: a change made earlier would be
  made on nothing. It goes into that layout when the user may (their own, or a shared one with
  update access); otherwise (the studio default, a read-only share) the first change saves a copy
  the user owns, "{name} (mine)", and picks it; changes made while that copy is saved go into it.
  Their working view is never overwritten by a copy. Changes to one layout run one at a time,
  each on what the one before saved. The user's own layout keeps what this browser tab saved over
  an older refetch (`useUserLayout`).
- **Editing a layout** (`layoutEditor.ts`, one edit for the whole app): Customize (right-click the
  sidebar, or the layout menu) copies the layout that applies into a draft, which `useNavLayout`
  hands the sidebar and the tab rows instead. They then show every item and tab, hidden ones
  dimmed, each with an eye, and nothing folds into More or "+N"; drag reorders tabs in their row
  (`reorderTabs`) and items anywhere on the sidebar, across sections (`reorderItems`), both merged
  into the stored order. The sidebar's dividers are the user's too (Milan, 2026-11-26): they
  drag like items, a button on each removes it and Add divider puts a new one at the end
  (`addDivider`, `removeDivider`). The first such change writes the sidebar as shown, section
  dividers included, into the layout and marks it `free`; a layout no one rearranged keeps the
  sections.
  The bar along the bottom (`LayoutEditBanner`, in the app shell, so on every page) saves with the
  `update` of the layout that applied when editing began, wherever the user is: the sidebar, the
  tab rows, the pins and the admin pages on the sidebar (`applyEdits`). While editing,
  pinning, unpinning, renaming, moving and repointing a pinned tab change the draft
  (`usePinnedViews`), so Cancel drops them; a view created meanwhile stays a view. The rail's
  switch check reads the draft, so a page hidden in it stays open when Save makes a copy.
  Settings' own tab row doesn't follow layouts (no eyes; decided 2026-11-25). The admin area does:
  while editing it shows every admin page, the Admin menu's dimmed; the eye moves one between the
  sidebar and the Admin menu (`togglePromoted`) and drag orders the sidebar's (`reorderPromoted`),
  both into the layout's `promoted`.
- **Moving a pinned tab** moves it within its row as shown (`moveTabInRow`) and records the row's
  order in the layout; repointing or unpinning a pin replaces or drops its id there
  (`replaceTabId`).
- **Applying it** (`useNavLayout` → `NavLayout`): `filterNavigation` hides items, `arrangeRail`
  lays out the sidebar: a `free` layout's order (an item it doesn't mention, such as an addon page
  installed since, goes after the last item of its section, else at the end), otherwise the
  sections with the layout's order within each. Outside editing, a divider that separates nothing
  (at either end or after another one, as when the user can't see an item, or after the items
  folded into More) doesn't show; the stored order keeps it. `arrangeTabs` lays out the tab rows (an
  unmentioned pin follows its page, other unmentioned tabs at the end), `splitAdminItems` the
  promoted admin pages. A hidden page still opens by its link; when another layout applies while
  a page or pinned tab it hides is open (and the one before showed it), the sidebar opens the
  item's first shown tab, or the new layout's first item when it hides the item too. The first load and another project aren't a switch. Pages find themselves in AYON's tabs,
  not in the arranged row, so a hidden or reordered tab doesn't lose its page.
- **A pinned tab shows only for a view the user can read**: one in the views list for its type
  (the list checks read access), not one a GET by id returns.
- **A pinned tab is active by `?view=`**, not by path: `AppNavLinks` marks the page's own tab
  active only when no pinned tab of that page matches the parameter.

## Gotchas

- `AppNavLinks` and `NavRail` measure themselves after every render to fold (tabs into "+N", items
  into More). Compare with the current state before `setState`: an unconditional functional update
  in a layout effect loops ("Maximum update depth exceeded"). Tab titles are capped at 240px and
  `li`s don't shrink, so the measured widths are stable.
- A plain click on the selected sidebar item does nothing (`RailItem`): a page can change its URL
  without the router.
- A rail menu opens from `MoreAnchor`, a span beside the button; Escape focuses it and it hands the
  focus to its button.
- Creating a view needs `working: false`, or it replaces the user's working view of that type.
- A dragged tab or sidebar item is a link: after the drop the browser clicks what is under the
  pointer, so `swallowNextClick` drops that click at the window. Dragged tabs are keyed by tab id;
  index keys move the drag's transform onto another tab's element.
- A pinned tab's draft stores a cleared field as `null` (session storage is JSON and drops
  `undefined`); `applyDraft` leaves those fields out.
- A studio view created from a project page refreshes the studio list, not the project's, which
  holds studio views too: refetch the project's list before linking to the new view.
- Don't remount a page to reset it for another pinned view: the slicer flickers. Pages that keep
  local copies of view settings drop them when `controlledKey` changes (Products:
  `VPViewsContext`); Overview and Lists drop theirs when the settings change.
- An addon page with its own views handling (Reports bundles its own) doesn't read this context:
  pinning its views needs the addon to add the pin and open `?view=` itself.

## Checking a change

- `tests/unit/navigationPlacement.spec.ts` (placement, filter, order, active item),
  `tests/unit/pinnedViews.spec.ts` (pins: add, rename, repoint, which ones show, links) and
  `tests/unit/navigationLayouts.spec.ts` (arranging items and tabs, moving a tab, which layout
  applies).
- `tests/e2e/permissions/navigation.spec.ts` (who sees which settings) and
  `tests/e2e/bundles/bundleAddons.spec.ts` (addon pages follow the user's bundle).
- Look at a project, Home, Settings, the Project manager, Inbox and a review session, as an admin and
  as a regular user, at 1920 and at 1280 × 600 (More) and 1024 (+N).
