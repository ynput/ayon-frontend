# Settings editor

The RJSF form behind studio, project and site settings, Anatomy and server config. It has two
layouts: the classic one (nested folding panels, `SettingsPanel.jsx`) and the flat one, opt-in per
user with `frontendPreferences.flatSettingsLayout` (_Profile > Flat settings layout_).
`SettingsEditor.jsx` reads the preference and passes `formContext.flatLayout`; the templates in
`FormTemplates/` check it and draw either the classic markup or the flat pieces (`SettingsGroup/`,
`SettingField/`, `SettingsOutline/`). The classic markup is what the e2e tests rely on, so keep it
as it is when changing the flat layout.

## Flat layout

An addon is a sheet. Its top-level groups are cards (a title on the sheet over panels of one-line
rows), deeper groups are sections (a title above their own panels). Sub-sections get panels beside
their parent's, never inside them, so nothing is indented. A section's on/off switch is the first
row of its panel (`leadsPanel` in `getSettingsGroupLayout`). Only records fold: list items, and
groups that read as records.

### How a list item is drawn

`getListItemLayout` (`FormTemplates/listItemLayout.ts`) picks one of four presentations. Only the
fields decide, never the schema's `layout` hint or the length of a saved value, so one shape always
looks the same and typing never flips it.

| Presentation | When |
| --- | --- |
| `plain` | A single value (a path in a list of paths), or a record with one field showing |
| `row` | Single-value fields only, up to 6, whose cells fit in 660px. Labels once, as column headings |
| `card` | Single-value fields that don't fit a row, up to 8, whose values are paths per platform (`windows`, `linux`, `darwin`). The name on top, the values in a grid |
| `fold` | Anything else: unrelated values too wide for a row, more than 8 fields, or a list, group, code editor or multi-select with many options inside. A titled line with a summary |

- Cell widths (`CELL_WIDTH`): text 200, date 160, multi-select with up to 8 options 160, name 120,
  dropdown 120, number 100, short code 88, switch 72, colour 48. They are also the widths the
  cells are drawn at: `ObjectFields` sets `--settings-cell-width` from them (`getRowCellWidth`),
  so the budget and the drawn row never disagree.
- A list narrower than its rows need (`getRowNeededWidth`, which adds `ROW_CHROME`, the handle, X
  and gutters from the Sass) draws them as cards or folds (`asNarrowListItem`, via `useFitsWidth`).
- An item whose only field is a group of single values (a path mapping) is drawn as that group's
  row or card (`wrapped`), not as a fold holding a group.
- Fields out of the level being edited (studio, project, site) take no room (`isPropertyInScope`).

### Groups that fold like records

`getFoldingGroupNames` folds an object's groups like list items (no handle, X or add button) when
there are 4 or more and either they all share one shape (same `$ref`, or the same fields: the
Application definitions), or more than half are plugins (an `enabled` switch, or a PascalCase name
like `ValidateMeshUVs`, since AYON keys plugin settings by class name). All of a card's groups
fold or none do, so a card never mixes boxes and sections.

### Open state

`useFoldState` is shared by list items (`useListItemFold`) and groups (`useGroupFold`). Open items
are stored for the browser session (`openItemsStore`, key `settings-flat-open-list-items`), keyed
by addon, project, site and the editor's `anchorScope` (`getListItemsPrefix`). A breadcrumb link
pointing inside an item (`formContext.currentId`) opens it once; folding it again afterwards
sticks. Outline jumps don't open folds: the outline lists cards and sections, never what's inside
a fold. While `formContext.searchText` is set, every fold is open and its toggle is disabled
(`forcedOpen`), so no match is hidden. That makes the search
in the flat layout costly on big addons: 2.4s of long tasks with Core, Maya and Applications open,
in a single run on a dev server.

### Outline

`SettingsOutline/` reads groups from the rendered sheet, not the schema, and highlights the one
being read (`useSettingsOutlineCurrent`). A clicked item stays highlighted until the user scrolls
by hand. Where CSS scroll-spy is supported (`scroll-target-group`, Chrome), the highlight reads the
browser's `:target-current` link; elsewhere an `IntersectionObserver` tracks the group crossing the
middle of the view. Only Chrome has been checked. A jump (`scrollToSettingsGroup`) renders every
card until `scrollend`, or 2 seconds at most; a new jump ends the one still settling. The toolbar
toggle shows only while an outline has links (`outlineAvailability.ts`).

The outline shows only when it helps (`isOutlineNeeded`): the sheet has at least 2 groups to link
to, and either more than 20 settings showing (rows of `SettingField`, not those a search hides) or
some of them out of view below the scroll. It is checked again as the sheet changes (folds, search)
and when the sheet or its panel is resized. It can't flicker: the rail shows when the sheet
overflows at full width, and narrowing the sheet only makes it taller; it hides when the sheet
fits beside it, and widening the sheet only makes it shorter.

Addon settings and Site settings stack one editor per selected addon (and site). They share one
outline (`AddonSettingsSheets`, editors get `outline={false}`), so every sheet starts at the same edge
whether or not it has groups of its own. Each sheet heads its cards in that rail. A rail lists a
sheet only when its root group has an id, which only a scoped editor gives it. Its link reads the
sheet's title without the bundle, project and site badges (`.settings-title-badges`).

- With several big addons the rail is far taller than the view (Maya, Core, Deadline and Task
  Status: 295 links, about 9,000px). It scrolls itself to keep the current link in view, and
  scrolls only itself: `scrollIntoView` would move the sheet too.

## Gotchas

- `.form-object-field-item` is `display: contents`. Anything drawn on an item (lines, boxes,
  positioning, `content-visibility`) goes on the wrapper inside it.
- `:has()` can't be nested, and `X > :is(a, b > c)` never matches its second branch. Both fail
  silently, so the flat rules write those selectors out in full.
- Group element ids are `settings-<fieldId>` (`getSettingsGroupAnchor`). Field ids start with
  `root`, and a bare one gave the root group `id="root"`, the app's mount element.
- Field ids repeat across addons (Maya, Nuke and Houdini all have `root_publish`). Editors that
  share a page pass `anchorScope` (addon name and site), and their ids become
  `settings-<scope>-<fieldId>`. Outline items are keyed by that element id, and the native
  scroll-spy resolves links by id in the whole document, so a clash would highlight the wrong addon.
- Each row and list item has `isolation: isolate`, because ARC's dropdown button has `z-index: 12`
  and would draw over the sticky titles. Popups that must escape a row open in a portal (the date
  picker) or opt out (the folded text preview).
- Cards after the first two have `content-visibility: auto` and remember their last height (Maya's
  sheet is about 55,000px with every fold open). A skipped card has no layout: outline jumps render
  every card until the scroll ends (`settings-sheet-measure`), and `useFitsWidth` keeps its last
  answer while a card has no width.
- The outline is as tall as the panel it scrolls in: it measures its scroll container
  (`getScrollContainer`, a `ResizeObserver`) into `--settings-outline-height`, so it works on any
  page without a size container. It hides below 720px with an `@container` query.
- The colour scheme picker (`ListColorScheme/`) needs `formContext.onSetValue`, which only
  `AnatomyEditor` provides. Other editors don't show it.
- `isGroupSchema` mirrors the branches in `FieldTemplate` and `ObjectFieldTemplate` that draw a
  panel, and `getSettingFieldKind` mirrors `TextWidget` and the widget map in `SettingsEditor.jsx`.
  Change them together.

## Loading and search (`src/containers/AddonSettings/`)

These apply to both layouts.

- Resting the pointer on an addon for 80ms prefetches its schema, values and overrides
  (`useAddonSettingsPrefetch.ts`). The arguments must match the queries in `AddonSettingsPanel`
  exactly (`projectName: null`, `siteId: null`), or the cache misses. Site settings aren't
  prefetched, as they load per selected site.
- Search (`SettingsListHeader.tsx`) waits for a 250ms pause, skips a search it already ran, and
  applies the result in a React transition. The delayed search runs the latest search function
  (a ref), so it matches addons selected while the user was typing.
- After a save or an override change, `reloadAddons` clears the addon's form data and
  `AddonSettingsPanel` refills it from a request made after the save, never from the cached copy.
  Until then the editor keeps showing the last values: RJSF fills an empty form with the schema
  defaults and reports them as a change, which would replace the saved values.
- Each panel memoizes its editor and keeps the `context` the page rebuilds on every render stable
  while its values are the same (`useStableContext`), so an edit in one addon doesn't redraw the
  others. Its callbacks always call the latest ones.

## Checking a change

- Compare with `develop` in a separate worktree, against the same backend and bundle. Two Vite
  servers sharing `node_modules/.vite` break each other: give the worktree its own `node_modules`
  folder of symlinks.
- Classic panels sync their open state through a `session-storage` event. To open them all, write
  the `expanded-settings-keys` session storage key and dispatch the event; clicking them one by one
  flips them back.
- Alignment: switches and field right edges should line up with the card's right edge. Check
  Maya with every fold open, and a long plugin name in a folding row.
- Big addons to try: Maya (Publishers, Creators), Applications (Application definitions), Core,
  and Anatomy (roots as cards, statuses as rows, colour schemes).
