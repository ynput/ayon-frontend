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
- **Edits** go through the provider's `editTasks`, which calls the table's `updateEntities`
  (`useCellEditing`) once with one update per task: the task's `id`, `type: 'task'` and `entityData`. Not
  through `meta.updateEntities`: with a selection that one resolves the row's folder and the Status column
  of the selected rows. One call is one undo step. `entityData` is what undo and error messages use while
  the folder is collapsed (the task is not in the table's entity map).
- **Several task cells selected**: an edit on one card goes to every task the selected cells show, in any
  task column (`TaskColumnsSelectionContext`, apart from the main context because it changes with every
  click). Status and priority are set; an assignee is added to or removed from each task, the picker
  showing every assignee they have (the Task progress setup). With one cell selected only the card's own
  task is edited, so two cards in one cell stay separate. The table leaves the selection alone on a press
  on a card's picker (`.tag.editable`) in a selected cell; any other press selects as usual.
- **The page's task filter greys cards out, it never hides them.** The provider asks the same endpoint a
  second time (`scope: 'taskColumnsMatch'`) with the shown types and the page's filter and search; a card
  whose task is not in that answer is `dimmed`, once its folder was asked about. The filter is never
  evaluated in the client. The answer is asked for again when a shown task changes (a cache learns a
  task's new values, not whether it still matches), and held while a request is in flight so cards don't
  flash. A greyed out card can be edited by itself, and is left out of an edit of several cells.
- **Double click** on a card opens its task in the details panel (`setSelectedEntity`, as `EntityWidget`
  does), handled on the second press. **Space** plays the cell's task, not the row's folder
  (`useKeyboardNavigation` asks `getCellTask`: the card pressed last in the cell, else its first).
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

The context menu, copy, and the details panel for several selected cards still see the folder. Selection is
per cell: in a cell with two cards, an edit of several cells takes both.
Sorting by a task column and roll-ups on parent folders need tasks for rows that are not on screen.
