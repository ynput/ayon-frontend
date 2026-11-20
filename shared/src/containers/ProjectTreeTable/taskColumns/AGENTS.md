# Task columns

On a table whose rows are folders, one column per task type showing that folder's tasks of the type as
status cards (the Task progress card), editable in place. Used by the Overview page; the code is here so
other `ProjectTreeTable` pages can adopt it.

## How it fits together

- `useTaskColumns(enabled)` gives the table's `extraColumns` and the items for the column settings and the
  add-column menu ("Tasks"). `TaskColumnsProvider` above the table loads the tasks and holds which rows are
  tall. The page wires both (`OverviewTaskColumnsProvider`, `ProjectOverviewTable`).
- Cells read from `TaskColumnsContext`, never from the column definition: the columns array must not depend
  on task data or expanded rows, or every update remounts the cells and closes an open picker.
- A table without the provider has no task columns: `useTaskColumnsContext()` is null there and the row
  toggle and tall rows do nothing.

## Contracts

- **Column ids** are `taskcol__<type>`, the type name with everything but letters and digits written as its
  char code. Not `task_`/`folder_` (parsed as a parent scope) and no `-` (cell ids are parsed greedily).
  Views store these ids; changing the scheme drops saved task columns.
- **Data** comes from `getOverviewTasksByFolders` with `scope: 'taskColumns'`, a cache of its own. It must not
  share the Overview's cache or its queried-folders registry (a folder marked as queried by one would never
  load for the other), and it must not carry the page's task filter (a filtered-out task would blank its
  cell). The filter it does carry is the shown task types, so adding a column starts a new cache. Realtime
  updates and optimistic patches come with the endpoint (`overviewTask` tags).
- **Only rows on screen** are asked for, debounced. All folders share one cache entry and RTK Query ignores
  new args while it fetches, so the provider asks again after a fetch for rows that scrolled in meanwhile.
- **Edits** go through the table's `meta.updateEntities` with the task's `id`, `type: 'task'` and
  `entityData`, and without a selection. Without the id the edit goes to the row's folder; with the
  selection a status edit goes to the Status column of the other selected rows. `entityData` is what undo
  and error messages use while the folder is collapsed (the task is not in the table's entity map).
- **The cell is read-only to the table** (`readonly` class, no `editable`): no cell editor on double click
  or Enter, no clear. Paste writes nothing to these cells but keeps their place in the selection, so
  the values after them land in their own columns (`ClipboardContext`). The Overview's Delete button and the
  menu's Delete ignore cells of these columns, since everything selection-based acts on the row's folder.
- **A card is edited once its cell is selected**, as on Task progress: the first click selects. The cell
  swallows the click of the press that selected it, or the card (editable by then) opens a picker on it.
- **Tall rows**: `useDynamicRowHeight` returns the tall height for folder rows with tasks. Per-row toggles
  live in the provider for the visit; "expand all" is the view's `expandRows`.
- The card is designed for a 34px row. Below that the collapsed card is scaled (`zoom`) instead of clipped.

## Not there yet

Selection-based actions on a task cell (bulk edit, details panel, context menu, copy) still see the folder.
Sorting by a task column and roll-ups on parent folders need tasks for rows that are not on screen.
