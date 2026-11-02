# Table export

Export of project tables (overview, products, lists and review sessions) to Excel or CSV. It is a Power Pack feature:
the dialog is the Power Pack App module `tableExport/TableExportApp` (ayon-power-pack `frontend/modules/tableExport`) and
the server builds the file (`POST /api/addons/powerpack/{version}/export-table`, ayon-power-pack `server/table_export`).
Exports contain every row and inherited attribute the user may read, also rows the table has not loaded, and follow the
user's folder and attribute permissions. The host only says what the open table exports.

## How the parts meet
- `TableExportProvider` (`shared/src/context/table-export`, at the app root) holds the open page's `TableExportSource`.
  It is in the shared `context` entry, so the addon module reads the same context (see `src/remote/AGENTS.md`).
- A page renders a `TableExportSource` inside its table providers. It registers `projectName`, `canImport`, the selected
  row count, `getContent(scope, options)` (rows, columns and their labels) and `getSkippedColumns`.
- `openExport(scope)` sets the `tableExport` URL search param. The App module renders the dialog while the param is set
  and there is a source, and removes it on close. Without a Power Pack license `openExport` opens the Power Pack dialog.
- The contract types (`TableExportContent`, `TableExportSource`, ...) are hand written in `TableExportContextInstance.ts`,
  the endpoint isn't in the server's OpenAPI. Changing them changes what the Power Pack module receives: keep both in step,
  add fields rather than rename them, an older Power Pack keeps reading the old ones.

## Contract
- The request names rows by source: `folderIds`, `tasks`, `products`, `versions`, `entityList`. Tasks, products, versions and
  list items take the arguments of their GraphQL queries (filters, search, sortBy...), so a page sends what its table already
  queries with. Selections send ids (`entityList.itemIds` are list item ids, not entity ids).
- With products and no version ids, the server exports the versions of the exported products. Each product is followed
  by its versions: products in the order of `products.sortBy`, versions in the order of `versions.sortBy`, as when every
  product is expanded in the table. Send both sorts and the `representationFilter` the table queries with.
- `columns` are export keys, not table column ids. `tableExportColumns.ts` maps them; a table column without a key is listed
  as "Not exported" in the dialog. A new column needs a key here and a column on the server (an entity field, `attrib.*` or
  one of the server's extra columns).
- Parent columns (`folder_status`, `product_attrib_x`) export as `<scope>.<key>`, filled from the row's folder, task or
  product. Only the fields the server reads for parents are mapped (status, tags, dates, types, attributes). The server
  also fills name, label and path where the parent has them; it rejects other parent fields as unknown columns.
- `columnLabels` are the table's header labels, used when column names are labels.
- Import CSV can read a file back only for folders and tasks (`canImport`), as CSV with field names, raw values and the
  `entity_type` and `path` columns (`options.includeImportColumns`).
- Import CSV stops at a column it doesn't know. So that file only has the columns in Import CSV's field list
  (`GET /api/csv/export/hierarchy/fields`, fetched while the dialog is open), and `getSkippedColumns` lists the others
  with "(Import CSV can't read it)", e.g. the Folder column (the path already holds the parent).

## Adding export to a page
1. Add the built-in `'export'` item to the context menu. With the Power Pack export available and a registered source it
   opens the dialog; otherwise it falls back to the client-side CSV of the selected cells (`ClipboardContext.exportCSV`).
2. Render `TableExportButton` in the toolbar (with `onImport` it becomes one Import / Export menu button) and a page
   component with `TableExportSource`, whose `getRows` builds the rows from the page's query arguments (table) or the
   selected row ids (selection).

## Gotchas
- Visible columns come from the column settings, not `gridMap`: grid and card views don't register their columns.
  Their visibility is resolved by `resolveColumnVisibility`, the function the table uses, so the two can't disagree.
- One source at a time: the last page to register wins and its unmount clears it.
