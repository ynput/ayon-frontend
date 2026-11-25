# Navigation: sidebar, tab rows and where addon pages go

Spec: AYON-20261125-001 (variant B). A context is a project (`/projects/<name>/…`) or Home (every
other page). Its sidebar lists places; the selected place owns the tab row.

## How it fits together
- **One registry.** `useProjectNavigation`, `useStudioNavigation` and `useSettingsNavigation` build
  `NavItem`s from the sources the pages render from (core modules, the addon pages AYON reserves,
  legacy keyword remotes, `project.page` / `studio.page` contributions, classic iframe addons,
  settings sub-pages). The pages call the same hooks, so a tab and its page always agree.
- **The sidebar** (`NavRail`) is mounted once in `app.tsx`, beside `AppRoutes`, inside
  `.app-body` / `.app-page`. Pages still render their own `AppNavLinks`, with only the active
  item's tabs (`findActiveItem` by path): the views button portals into the tab and the tab row's
  access redirect keys on `useParams().module`, so the row can't move into a shared shell.
- **Settings** is one button at the bottom of every sidebar (`SettingsMenuButton`): the old apps
  menu (`AppMenu`) with the admin pages and the server's actions. `useAdminNavigation` only tells
  which pages select it. Menu id `app` is the one the `/appMenu` redirect (Ynput Cloud sign-in)
  reopens.
- **Addon routes** (`Route` keyword modules: review and storyboard sessions) add `addon-route` to
  `#root`: the sidebar hides and the wrappers are `display: contents`, so the page lays out as before
  the sidebar existed. The review player is `position: fixed` without offsets: it relies on that.

## Contracts
- **Item ids are stable** and are what layouts (workspaces) will refer to: a core module key
  (`production`, `reviews`, `workfiles`), `addon:<addon>/<page id>`, `group:<addon>/<group>`,
  `remote:<module>`, `classic:<addon>`. Don't derive them from labels or positions.
- **`filterNavigation` is the only filter** over the registry: access and the layout's hidden ids.
  Workspaces (Power Pack, a later spike) plug in through `NavLayout` there and nowhere else. It
  decides which items show; tabs keep their `accessLevels`, so the tab row can still redirect from a
  tab the user can't open.
- **Page placement** (`addon/src/scopes.ts` `PageMeta`): `placement`, `icon`, `section`, `group`,
  `groupTitle`, `order`. What a page declares wins; `knownPages.ts` places known addons that don't
  declare yet; anything else is `other` with the `extension` icon. `placement: 'tab'` puts the page
  in the first item (Production, My work).
- **Sidebar order:** `NAV_SECTIONS`, then `order`, then registry order.

## Gotchas
- `AppNavLinks` and `NavRail` measure themselves after every render to fold (tabs into "+N", items
  into More). Compare with the current state before `setState`: an unconditional functional update
  in a layout effect loops ("Maximum update depth exceeded"). Tab titles are capped at 240px and
  `li`s don't shrink, so the measured widths are stable.
- The selected sidebar item's click does nothing: a page can change its URL without the router.

## Checking a change
- `tests/unit/navigationPlacement.spec.ts` (placement, filter, order, active item).
- `tests/e2e/permissions/navigation.spec.ts` (who sees which settings) and
  `tests/e2e/bundles/bundleAddons.spec.ts` (addon pages follow the user's bundle).
- Look at a project, Home, Settings, the Project manager, Inbox and a review session, as an admin and
  as a regular user, at 1920 and at 1280 × 600 (More) and 1024 (+N).
