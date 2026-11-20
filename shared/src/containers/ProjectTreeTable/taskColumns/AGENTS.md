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
- **Selection is per card, on top of the table's cells.** The table selects cells. A cell with several
  cards is selected with all of them (range, keyboard) unless some were picked: a press picks the pressed
  card alone, Ctrl/Cmd adds or removes one (`pressCard`, `picks` in `TaskColumnsSelectionContext`, which
  is apart from the main context because it changes with every click). Picks are dropped for a cell the
  moment it is not selected. A Ctrl/Cmd press that only changes a selected cell's cards stops the event
  before the table sees it; presses in an open picker's list are not the cell's at all.
- **An edit on a selected card goes to every selected card's task**, in any task column. Status and
  priority are set; assignees are added to or removed from each task, the picker showing on how many of
  the tasks each one is (`mixedCounts` / `onMixedChange`, as the details panel does). Only selected cards
  have pickers. The table leaves the selection alone on a press on a selected card's picker
  (`.tag.editable`).
- **The page's task filter greys cards out, it never hides them.** The provider asks the same endpoint a
  second time (`scope: 'taskColumnsMatch'`) with the shown types and the page's filter and search; a card
  whose task is not in that answer is `dimmed`, once its folder was asked about. The filter is never
  evaluated in the client. The answer is asked for again when a shown task changes (a cache learns a
  task's new values, not whether it still matches), and held while a request is in flight so cards don't
  flash. That refresh asks about every folder asked about so far, not only those on screen.
- **A greyed out card is edited by itself and left out of an edit of several cells.** So is a folder the
  filter was not asked about yet, or whose tasks have not loaded (rows scrolled past quickly, or after
  Sync): unknown means "shown as it is" for a card but "not a target" for an edit, with a warning.
- **Double click** on a card opens the details panel on the selected cards' tasks (`openDetails`; the
  page's panel reads `detailsTaskIds`), handled on the second press. The panel then follows the selected
  cards until it is closed, the selection leaves the cards, or another entity is opened in it. Selected
  rows still come first. **Space** plays the cell's task, not the row's folder (`useKeyboardNavigation`
  asks `getCellTask`: the card pressed last in the cell, else its first). On a task row the key still
  plays the row's task.
- **Default width**: one card times the most common number of tasks of the type per folder, worked out
  once from the first folders loaded and then left, so a column does not change width while scrolling.
- **The cell is read-only to the table** (`readonly` class, no `editable`): no cell editor on double click
  or Enter, no clear. Paste writes nothing to these cells but keeps their place in the selection, so
  the values after them land in their own columns (`ClipboardContext`). The Overview's Delete button and the
  menu's Delete ignore cells of these columns, since everything selection-based acts on the row's folder.
- **A card is edited once it is selected**, as on Task progress: the first click only selects. The cell
  swallows the click of the press that selected the card, or the card (editable by then) opens a picker
  on it.
- **Tall rows**: `useDynamicRowHeight` returns the tall height for folder rows with tasks. Per-row toggles
  live in the provider for the visit; "expand all" is the view's `expandRows`.
- The card is designed for a 34px row. Below that the collapsed card is scaled (`zoom`) instead of clipped.

## Not there yet

The context menu and copy on a task cell still see the folder.
Sorting by a task column and roll-ups on parent folders need tasks for rows that are not on screen.
