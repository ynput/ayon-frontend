# Navigation: sidebar, tab rows and where addon pages go

Spec: AYON-20261125-001 (variant B). A context is a project (`/projects/<name>/…`) or Home (every
other page). Its sidebar lists places; the selected place owns the tab row.

The context reads as a path (Milan, 2026-11-27): Home, then in the top bar the project and the
entity. Home is the sidebar's first button, above a divider and the context's places, outside
`ProjectRail` / `StudioRail` so it stays put when the context changes; at Home it isn't filled (a
place below it is selected), only its icon. The sidebar is a sheet from the window's top, beside
the top bar and the page; Home's top is level with the path's, and the path starts in line with
the page's edge. Without a sidebar (guests, an addon's own route) Home leads the path in the top
bar instead (`.header-home`, hidden beside the sidebar in `index.scss`). The context pill leads
with the project's thumbnail (the pill's height but a 2px rim; without one, a placeholder with the
project icon, as on the Projects page) and isn't tinted. The pill's edit and copy buttons show
only while you point at it (or tab to them); they keep their room when hidden, so showing them
never folds the path again.

## How it fits together

- **One registry.** `useProjectNavigation`, `useStudioNavigation` and `useSettingsNavigation` build
  `NavItem`s from the sources the pages render from (core modules, the addon pages AYON reserves,
  legacy keyword remotes, `project.page` / `studio.page` contributions, classic iframe addons,
  settings sub-pages). The pages call the same hooks, so a tab and its page always agree.
- **The sidebar** (`NavRail`) is mounted once in `app.tsx`, in `.app-body` beside `.app-main`
  (the top bar over `.app-page`, which holds `AppRoutes`). Pages still render their own `AppNavLinks`: the project page and Home
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
  last one. While the arrangement is edited nothing folds and the sidebar scrolls.
- **Arrangements** (`NavArrangement.tsx`): an addon's `NavigationLayouts` module may arrange the
  navigation. `NavArrangementHost` (in the app shell, around the top bar, the sidebar and the
  pages) loads it and hands it the open project, AYON's toasts, store and router; the module reports
  the arrangement for the context on screen (`NavArrangementState`: the `NavLayout` to show, its id,
  `ready`, `customize`, the controls' actions while it is edited, the pinned views) and renders its
  own controls. Without the module the navigation is as AYON lays it out and nothing is editable.
  The header's `LayoutMenuHost` is the slot for the module's menu (`LayoutMenu`). AYON knows
  nothing of how an arrangement is stored or chosen.
- **Pinned views** (`pins/`, the arrangement's): a saved Overview, Products, Lists or Review view
  (`PINNED_PAGES`: pages that read the host's views context) pinned from the views menu
  (`ViewPinsProvider`, the pin on a saved view's row) becomes a tab right after its page's tab, in
  whichever sidebar item holds it (`placePinnedTabs`), linking to `…/<page>?view=<id>`.
  `usePinnedViews` shows the arrangement's pins the user can read and reports how a change went. The page then runs on the same `ViewsProvider`, controlled (`PageViews`,
  `usePinnedViewSettings`): it never selects the view or writes the working view; changes
  are a draft per view in session storage (`pinned-view-drafts`, the dot on the tab) until Save
  changes, Save as new or Revert in the tab's menu (`PinnedTabMenu`, also on right-click).
  The pages a view pins from lead their tab with that page's icon; a pinned tab has the same icon,
  smaller and dimmed, so it still says which page it opens wherever it is moved, and its name as
  any tab's (Milan, 2026-11-26: a lighter name was too quiet).
- **Addon routes** (`Route` keyword modules: review and storyboard sessions) add `addon-route` to
  `#root`: the sidebar hides and the wrappers (`.app-body`, `.app-main`, `.app-page`) are
  `display: contents`, so the page lays out as before the sidebar existed. The review player is `position: fixed` without offsets: it relies on that.

## Contracts

- **Names** (Milan, 2026-11-26): a project's first item is **Overview** (id `production`): the
  whole project, products included, also for studios that don't track production in AYON. The
  Overview page's tab is **Folders & tasks** (module, path and view type stay `overview`), as the
  page doesn't show products. Below, "Overview" is that page.

- **Item ids are stable** and are what arrangements refer to: a core module key
  (`production`, `reviews`, `workfiles`), `addon:<addon>/<page id>`, `group:<addon>/<group>`,
  `remote:<module>`, `classic:<addon>`. Don't derive them from labels or positions.
- **`filterNavigation` is the only filter** over the registry: access and the arrangement's hidden
  ids. Arrangements plug in through `NavLayout` there and in `splitAdminItems` (which admin pages
  are promoted from the Admin menu), nowhere else. It
  decides which items show; tabs keep their `accessLevels`, so the tab row can still redirect from a
  tab the user can't open.
- **Page placement** (`addon/src/scopes.ts` `PageMeta`): `placement`, `icon`, `section`, `group`,
  `groupTitle`, `order`. What a page declares wins; `knownPages.ts` places known addons that don't
  declare yet; anything else is `other` with the `extension` icon. `placement: 'tab'` puts the page
  in the first item (Overview, My work).
- **Sidebar order:** `NAV_SECTIONS`, then `order`, then registry order, a divider between
  sections; until an arrangement says otherwise.
- **A disabled item** (`disabled`: why, as its tooltip) keeps a place another context has, so the
  sidebar doesn't rebuild between Home and a project (Milan, 2026-11-27): Home's Review (id
  `reviews`, as the project's) while the review addon is in the bundle, until there is a
  studio-wide review. It has no tabs; `filterNavigation` keeps it, it is never active, it opens
  nothing and isn't where an arrangement switch lands.
- **Editing an arrangement** is the module's; the navigation offers its controls while
  `NavArrangementState.edit` is there: the sidebar and the tab rows show every item and tab, hidden
  ones dimmed, each with an eye, and nothing folds into More or "+N"; drag reorders tabs in their
  row and items and dividers anywhere on the sidebar (the actions get the row as shown); Add
  divider and a button on each divider; the admin area shows every admin page, the Admin menu's
  dimmed, and its eye and drag move them. Right-click on the sidebar offers `customize`. Settings'
  own tab row isn't arranged (no eyes; decided 2026-11-25).
- **Showing it** (`arrange.ts`): `filterNavigation` hides items, `arrangeRail` lays out the
  sidebar: a `free` arrangement's order (an item it doesn't mention, such as an addon page
  installed since, goes after the last item of its section, hidden ones included, so it is in the
  same place while editing; else at the end), otherwise the sections with its order within each.
  Outside editing, a divider that separates nothing (at either end or after another one, as when
  the user can't see an item, or after the items folded into More) doesn't show. `arrangeTabs` lays
  out the tab rows (an unmentioned pin follows its page, other unmentioned tabs at the end),
  `splitAdminItems` the promoted admin pages, and `iconsOnly` narrows the sidebar to its icons (the
  host remembers it in this browser, so the sidebar has its width before the module loads). A
  hidden page still opens by its link; when another arrangement applies (its id) while a page or
  pinned tab it hides is open (and the one before showed it), the sidebar opens the item's first
  shown tab, or the arrangement's first item when it hides the item too. The first load and another
  project aren't a switch, nor is anything before `ready`. Pages find themselves in AYON's tabs,
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
  `tests/unit/pinnedViews.spec.ts` (which pins show, links, drafts) and
  `tests/unit/navigationArrange.spec.ts` (showing an arrangement: items, dividers, tabs).
- `tests/e2e/permissions/navigation.spec.ts` (who sees which settings) and
  `tests/e2e/bundles/bundleAddons.spec.ts` (addon pages follow the user's bundle).
- Look at a project, Home, Settings, the Project manager, Inbox and a review session, as an admin and
  as a regular user, at 1920 and at 1280 × 600 (More) and 1024 (+N).
