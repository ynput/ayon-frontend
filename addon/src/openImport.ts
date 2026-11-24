// Open AYON's import dialog from addon code, for rows the addon's server imports. The dialog
// reads CSV and Excel files, pasted tables and the file types the addon reads itself, maps their
// columns and values and previews the import, as it does for AYON's own imports. The host does
// the work (`provideHost`).
import { getHost } from './hostBridge'

/** The result of an import, as AYON's own imports return it. */
export interface ImportResult {
  created?: number
  updated?: number
  skipped?: number
  /** rows that stopped the import; rows with errors are skipped and listed in `failedItems` */
  failed?: number
  /** row number (from 1): why the row was not imported */
  failedItems?: Record<string, unknown>
  skippedItems?: Record<string, unknown>
}

/**
 * A file type the addon reads itself, such as a calendar. The dialog offers it next to CSV and
 * Excel and turns a file of this type into CSV with `toCSV`; from there the import is the same as
 * for a CSV file: the server gets the CSV, and the rows go through the column and value mapping.
 */
export interface ImportFileType {
  /** what the files are, for the dialog's file button: `calendar` makes "Choose a CSV, Excel or calendar file" */
  label: string
  /** the file name endings, with the dot: `['.ics']`. Matched without regard to case. */
  extensions: string[]
  /** the media types, which the file picker also offers: `['text/calendar']` */
  mimeTypes?: string[]
  /**
   * The file as CSV text, with a header row. The dialog shows the message of a thrown error as
   * the reason it could not read the file.
   */
  toCSV: (file: File) => Promise<string>
}

/**
 * What the import dialog imports into. The addon's server answers two endpoints, with the
 * contract of AYON's own imports (`/api/csv/export/{type}/fields` and `/api/csv/import/{type}`):
 *
 * - `fieldsUrl` (GET, `project_name` query): the columns rows can map to, `ImportableColumn[]`.
 * - `importUrl` (POST, `file_id`, `preview` and `project_name` query, `ColumnMapping[]` body):
 *   imports the file the dialog uploaded to `/api/csv/import/upload`, returns `ImportStatus`.
 *   The dialog calls it with `preview=true` first: then it validates and writes nothing.
 */
export interface ImportTarget {
  /** names the mapping presets users save in the dialog, one set per id: `myaddon.logs` */
  id: string
  /** what the rows are, lowercase and plural: the dialog says "Import time logs" */
  itemsLabel: string
  /** the dialog's subtitle: `Time logs` */
  label?: string
  /** the addon's endpoint for the columns, such as `/api/addons/myaddon/1.0.0/logs/import/fields` */
  fieldsUrl: string
  /** the addon's endpoint that imports the rows */
  importUrl: string
  /** the project of the import, sent to both endpoints */
  projectName?: string
  /** a CSV file to offer as a template, by URL */
  templateUrl?: string
  /** file types the dialog reads with the addon's code, next to CSV and Excel */
  fileTypes?: ImportFileType[]
  /** called once the rows are imported (not after a preview), e.g. to refetch what shows them */
  onImported?: (result: ImportResult) => void
}

/**
 * Opens AYON's import dialog for an addon's rows. Works anywhere, also in `run` and `menu` pieces.
 * Returns `false`, and does nothing, when the host has no import dialog (the standalone dev shell).
 */
export const openImport = (target: ImportTarget): boolean => {
  const open = getHost().openImport
  if (!open) return false
  open(target)
  return true
}
