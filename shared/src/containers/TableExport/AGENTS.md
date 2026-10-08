# Table export

The Export dialog of project tables (overview, products, lists and review sessions). The server builds the file
(`POST /api/csv/table/export`, ayon-backend `api/data_import/export_table.py`), so exports contain every row and inherited
attribute the user may read, also rows the table has not loaded, and follow the user's folder and attribute permissions.

## Contract
- The request names rows by source: `folderIds`, `tasks`, `products`, `versions`, `entityList`. Tasks, products, versions and
  list items take the arguments of their GraphQL queries (filters, search, sortBy...), so a page sends what its table already
  queries with. Selections send ids (`entityList.itemIds` are list item ids, not entity ids).
- With products and no version ids, the server exports the versions of the exported products.
- `columns` are export keys, not table column ids. `tableExportColumns.ts` maps them; a table column without a key is listed
  as "Not exported" in the dialog. A new column needs a key here and a column on the server (an entity field, `attrib.*` or
  one of the server's extra columns).
- `columnLabels` are the table's header labels, used when column names are labels.
- Import CSV can read a file back only for folders and tasks (`canImport`), as CSV with field names, raw values and the
  `entity_type` and `path` columns. The dialog's "Use import settings" sets exactly that.

## Adding export to a page
1. Wrap the page in `TableExportProvider` above the provider that builds its context menu items.
2. Add the built-in `'export'` item to the context menu. Inside a `TableExportProvider` it opens the dialog; without one it
   falls back to the client-side CSV of the selected cells (`ClipboardContext.exportCSV`).
3. Render `TableExportButton` in the toolbar (with `onImport` it becomes one Import / Export menu button) and a page
   component with `TableExportDialogHost`, whose `getRows` builds the rows from the page's query arguments (table) or
   the selected row ids (selection).

## Gotchas
- Visible columns come from the column settings, not `gridMap`: grid and card views don't register their columns.
- The export is a plain `fetch`, not an RTK mutation. The file does not belong in the store, and the review addon's modules
  install their own copy of the API middleware, which throws for mutations it does not know.
- The dialog settings (except rows) persist in localStorage (`table-export-settings`).
