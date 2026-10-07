# List values

A list item can hold its own value for any attribute of the listed entity (`entity_list_items.attrib`),
not only for the list's own attributes. The Lists table shows these "list values" next to the entities'
values and compares them with the entities or another list. This is a powerpack feature: the behaviour
lives in the powerpack module `ListValues` (remote `slicer`, ayon-power-pack
`frontend/modules/slicer/src/ListValues`). Core keeps the data, generic table extension points, a view
setting slot, the rendering of compare columns and rows, and a community fallback.

## Data

`GetListItems` returns three maps per item (`getLists.ts`, typed in `EntityListItem`):

| Field | From | What |
| --- | --- | --- |
| `listAttrib` | edge `attrib` | values set on the list item (own attributes and overrides) |
| `entityAttrib` | node `allAttrib` | the entity's values, inherited ones included |
| `attrib` | edge `allAttrib` | list values over entity values; what the backend sorts and filters `attrib.*` by |

`entityAttrib.*` sorts and filters by the entity's values only. Optimistic cache patches keep the three
maps in step (`shared/src/api/queries/entityLists/listItemValues.ts`).

## Contract with the powerpack

`types.ts` is the contract. The powerpack keeps a copy of it, so change both sides together and bump
`LIST_VALUES_API_VERSION` on a breaking change (core falls back to `communityListValues` on a mismatch).
`ListValuesProvider` loads the module with `useLoadModule` (`skip` without a powerpack license,
`minVersion` = the first powerpack version with it).

The module exports a hook (`useCompareView`), so the subtree below `ListValuesProvider` is keyed by the
module: when the powerpack module replaces the fallback (once, while the page loads) it remounts
instead of changing the hook order.

What the module does, and what core gives it:

- `resolveValues` gives each row's `attrib`, `ownAttrib` (the rest is greyed as inherited) and marks
  (tooltips); `ListItemsDataContext` builds the rows (`getRowValues`).
- `getEditTarget` routes attribute edits (`useUpdateListItems`). Compare columns with the entities'
  values send `meta.listValueTarget = 'entity'`; list attributes always go to the list item; fields
  only the entity has (status, assignees, ...) always go to the entity, and with the powerpack their
  headers show the entity type's icon (`ColumnConfig.headerIcon`). Several list item edits are saved in
  one bulk `PATCH /lists/{id}/items`. `readsEntityValue` (edit target is the entity, i.e. without the
  powerpack) switches sort and filter keys from `attrib.*` to `entityAttrib.*` (`entityValueFilter.ts`).
- `useCompareView(host)` (called in `ListItemsDataContext`) owns the compare choice, loads the compared
  list through `host.useListItems` (`useListItemsForListValues`, the page's RTK cache), and returns the
  compared values with their tint, marks for the list's cells and the items only in the compared list
  ("Show entities from both lists"). Core renders the compare columns (`useCompareColumns`) and appends
  those items as rows with `TableRow.readOnly`.
- `Controls` (toolbar) and `CompareSettings` (Customize > Compare) are the module's components. The
  compare settings are stored in the view as one opaque `listValues` setting
  (`useListsViewSettings`); the module defines its shape. The list picker dialog is the module's, around
  core's `ListPicker` (the lists table in picker mode).
- `getCellMenuItems` and `getColumnMenuItems` are the list value actions in the cell context menu and in
  attribute column header menus (`ColumnConfig.menuItems`); `useListValueActions` gives them the
  requests, loading every list item, toasts and the confirm dialog (`ListValueActionsHost`).
- `getListMenuItems` adds "Compare with current list" to the lists sidebar menu.

## Gotchas

- Compare column ids: `compare_attrib_<name>` (with the entities, sortable by `entityAttrib.<name>`) and
  `compare_list_attrib_<name>` (another list, read-only, not sortable). They set `after`, which places
  them next to their attribute column even in a saved column order (`ProjectTreeTable`
  `resolvedColumnOrder`) and keeps them out of the saved column settings: they are always shown, and
  a column resize or row height change would otherwise save them as hidden. Each pair gets
  `ColumnConfig.groupEdge` (start on the attribute column, end on the compare column).
- Rows only in the compared list: their row id is the compared list's item id, so they're not in
  `listItemsMap`. `useUpdateListItems` drops edits to such rows (paste and multi-cell edits bypass the
  read-only cells) and list item menu actions skip them; they offer "Add to this list" instead.
- The lists sidebar doesn't select a list on right-click (`SimpleTable` `selectOnContextMenu`), so its
  menu items act on the right-clicked rows.
- The tint (`AttribCellMark.highlight`) is a layer behind the cell, so the opacity of greyed values
  doesn't fade it; the cell is the td's first child with an id (`useCellContextMenu`).
- Paste derives the field from the column id, so a paste into a compare column arrives as a top-level
  attribute name. `useUpdateListItems` drops top-level attribute names for that reason.
