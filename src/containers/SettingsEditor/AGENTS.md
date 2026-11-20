# Settings editor

The RJSF form behind studio, project and site settings, Anatomy and server config. It has two
layouts: the classic one (nested folding panels, `SettingsPanel.jsx`) and the flat one, opt-in per
user with `frontendPreferences.flatSettingsLayout` (_Profile > Flat settings layout_).
`SettingsEditor.jsx` reads the preference and passes `formContext.flatLayout`; the templates in
`FormTemplates/` check it and draw either the classic markup or the flat pieces (`SettingsGroup/`,
`SettingField/`, `SettingsOutline/`). The classic markup is what the e2e tests rely on, so keep it
as it is when changing the flat layout.

Forms outside the editor follow the same preference (`useFlatSettingsLayout`): the Users details
panel, the profile, Secrets, the attribute dialog, and the Teams page's member and team settings. They are ARC `FormRow`s, drawn flat by the
global `src/styles/flatForm.scss` (`flat-form`, `flat-form-title`, `flat-form-panel`; global, as
dialogs are portalled). Keep its spacing and surfaces in step with `SettingsEditor.sass`.

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
- A list of records is always a list group (`isListGroupSchema`), `layout: compact` or not
  (the access groups' access lists). Classic draws a compact one as a field, beside a dashed
  line; the flat box rules skip lists inside a field (`.form-inline-field-widget`).

### Groups that fold like records

`getFoldingGroupNames` folds an object's groups like list items (no handle, X or add button) when
there are 4 or more and either they all share one shape (same `$ref`, or the same fields: the
Application definitions), or more than half are plugins (an `enabled` switch, or a PascalCase name
like `ValidateMeshUVs`, since AYON keys plugin settings by class name). All of a card's groups
fold or none do, so a card never mixes boxes and sections.

### Directory mapping as pairs

Maya and Nuke store directory mapping (`DirmapPathsSubmodel`) as two lists of strings,
`source_path` and `destination_path`, matched by position. The flat layout draws them as one
list of pairs (`PathMappingField`): a row maps a source to a destination, and adding, removing or
reordering a pair changes both lists.

- Only an object with exactly those two fields pairs up (`isPathMappingSchema`). Other objects
  with two lists side by side hold unrelated lists (FFmpeg input and output arguments, families
  and tags), so the rule is by field name, not by shape.
- A pair edit is one write of the whole object. `SettingsObjectField` (registered as RJSF's
  `ObjectField`) passes the object's `onChange` down through `PathMappingContext`; writing the
  two lists one after the other would lose the first, as RJSF builds each change from the
  object's current value.
- Saved lists of different lengths show as many pairs as the longer one, with an empty value
  where the other ends. Nothing is written until the user edits a pair.
- The column headings keep each list's override colour, right-click menu and breadcrumb
  (`useFieldOverride`). Both lists are marked changed on every edit.
- The classic layout, and a mapping whose list is out of scope or disabled, draw the two lists.
- The lasting fix is in the addons: a list of `{source, destination}` records.

### Dropdowns and multi-selects

- A dropdown on its label's line is sized to its value (up to half the row). `StyledDropdown`
  in `SelectWidget` gives the value `width: 0` so it fills the classic field; the flat rule
  undoes that, and only there.
- A multi-select's closed value (`MultiSelectValue`, through ARC's `valueTemplate`) shows the
  values that fit, then `+N`, and its tooltip lists them all. Every value stays laid out (the
  others unseen), so the field's natural width is the whole list's. It measures with fractional
  sizes: rounded ones put a list that fits exactly a pixel over and show a false `+1`.
- A value too long to show beside the count (or a lone value too long for the field) is cut to
  the room left, with an ellipsis. It keeps its width (`flex: none`): the unseen values after it
  overflow the field and would squeeze it to nothing. A hidden spacer (`multi-select-sizer`) keeps
  the width it lost in the field's natural width, or the field would shrink to the cut value.
- It gets a clear button, except in a boxed row's cell, where it would sit by the row's own X.
- Its menu lists the selected options first, in the order they had when it opened
  (`openedSelection`): each pick saves at once, and ARC's `sortBySelected` would move the
  option from under the pointer.

### Raw settings of a group

- The right-click menu of a group's title (cards, sections, list items, lists drawn as groups,
  the sheet) has "Edit raw settings...", in both layouts, where the group's place in the data is
  known. It opens `SettingsJsonDialog` with the group's value as it is in the form, unsaved edits
  included.
- The dialog refuses JSON that doesn't parse, or isn't of the value's kind (a group typed as a
  list, or emptied to `null`; `getKindMismatch`): the form would draw it as empty and save it as
  it is. A value that was empty takes any kind. Every editor gets this check, whatever its setter.
- `SettingsEditor` holds the dialog, outside the RJSF form; the menus reach it through
  `formContext.onEditJson`. Confirming sets the value through the editor's own setter:
  - `context.onSetRawValue` (AddonSettings: `pushValueToPath`, shared with Paste). It checks the
    shape (`sameKeysStructure`: no group or list turned into `null`, nor a list into a group at
    any depth), then works the changed keys under the path out again against the saved settings,
    so a value set back to what is saved is no longer a change. The addon's other changes stay.
  - `context.onSetValue` (Anatomy).
  - Else as an edit (`onChange`), marking the keys that changed: ServerConfig saves only with
    changed keys, and a whole sheet edited has no path of its own.
- Read only (`readOnlySettings.ts`, worked out when a menu opens: it walks the group): the
  dialog shows the JSON to select and copy, the editor refuses typing, and Confirm is greyed
  out with the reason as its tooltip. Paste is greyed out too.
  - No edit permissions: hosts set `context.readOnly` (project settings without
    `canEditSettings`, project anatomy without `canEditAnatomy`, a project's access groups
    without write access to "Project access", Global for non-admins). The override actions
    are greyed out as well.
  - The group or field holds a field the form shows as read-only (`disabled`, `readonly`, or a
    `fixedValue` it has): only Paste and the dialog, the override actions stay.
- The dialogs are portalled out of the form: settings tokens like `--space-2` don't reach them.
  Use the app's (`--base-gap-large`).
- It is not the addon list's "Low-level editor" (`RawSettingsDialog`): that one edits the saved
  overrides of a whole addon and saves them at once. A failed load shows its error and can't be
  saved over (it would read as "no overrides" and replace them). It opens behind a warning: the
  editor is dimmed and `inert` (`JsonCodeEditor`'s `locked`) until "Continue", which has focus.
- Both dialogs share `src/components/JsonCodeEditor`: the editor frame, its colours, the dialog's
  size and layout, and 2-space JSON (the editor's Tab key indents by 2 as well). Change them
  there, so the two don't drift apart.
- The editor draws a coloured copy of the text under a transparent textarea. Every element in it
  has to be monospace 12px (`!important`): the app's font reaches the coloured spans otherwise,
  so indents look narrower and the colours no longer line up with the cursor.
- JSON colours come from app tokens. The editor's own palette follows the app's theme (the
  `data-color-mode` that `applyTheme` sets on `<html>`), and colours keys and strings the same.

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

The sheet is centred in its panel (`.settings-flat-layout`: margin, sheet, margin), and the rail
sits in the left margin, against the sheet. The left margin is at least the rail's 200px while a
rail is rendered, hidden or not, so hiding or showing it never moves the sheet. In a panel too
narrow for both margins to hold the rail, the right one gives way first. Nested layouts (one per
editor under a shared rail) are a single column.

Addon settings and Site settings stack one editor per selected addon (and site). They share one
outline (`AddonSettingsSheets`, editors get `outline={false}`), so every sheet starts at the same edge
whether or not it has groups of its own. Each sheet heads its cards in that rail. A rail lists a
sheet only when its root group has an id, which only a scoped editor gives it. Its link reads the
sheet's title without the bundle, project and site badges (`.settings-title-badges`).

- With several big addons the rail is far taller than the view (Maya, Core, Deadline and Task
  Status: 295 links, about 9,000px). It scrolls itself to keep the current link in view, and
  scrolls only itself: `scrollIntoView` would move the sheet too.
- A wheel over the rail never scrolls the sheet. A rail that scrolls holds the wheel at its ends
  with `overscroll-behavior: contain`; a rail short enough not to scroll has no scrolling for
  that to act on, so a `wheel` listener stops it (ctrl + wheel, the browser's zoom, still
  passes). Wheel, touch, key and pointer input inside the rail also leaves a clicked link
  highlighted, as it isn't reading the sheet.

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
- The flat sheet takes the colour of the panel the editor sits on (`--settings-sheet-bg`, which is
  ARC's `--panel-background`). Sticky titles paint it, and settings panels sit one step off it.
  A page that hosts the editor puts it on a panel (a `ScrollPanel` without `transparent`, or a
  wrapper with `--panel-background`, as in the New project dialog). On any other surface the
  sticky titles show as bands.
- Sticky titles stop below their scroll container's padding, and content scrolls through
  that strip above them. The editor's scroll container has no top padding: a `nopad`
  `ScrollPanel`, or a wrapper that scrolls itself (`AnatomyEditorPanel` in the New project
  dialog, not the padded dialog body).
- Override levels as text (labels, group titles, directory mapping headings) use
  `--settings-text-studio/project/site`, defined on `.rjsf`. On the light theme they are darker
  shades of the accents, which are too pale for text there. Bars and box edges keep the accents.
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
