export type TableExportScope = 'selection' | 'table'
export type TableExportFormat = 'xlsx' | 'csv'
export type CsvDelimiter = ',' | ';' | '\t'

export type TableExportSettings = {
  format: TableExportFormat
  delimiter: CsvDelimiter
  // readable: column names as in the table and values as shown (enum labels, full names,
  // dates); raw: field names and stored values
  content: 'readable' | 'raw'
  includeImportColumns: boolean // entity type and path, needed to import the file back
  selectionColumns: 'selected' | 'visible'
}

export const TABLE_EXPORT_SETTINGS_KEY = 'table-export-settings'

export const DEFAULT_TABLE_EXPORT_SETTINGS: TableExportSettings = {
  format: 'xlsx',
  delimiter: ',',
  content: 'readable',
  includeImportColumns: false,
  selectionColumns: 'selected',
}

// what Import CSV needs to read a hierarchy export back
export const IMPORTABLE_SETTINGS: Partial<TableExportSettings> = {
  format: 'csv',
  content: 'raw',
  includeImportColumns: true,
}

// Import CSV reads any delimiter, but only takes .csv files: tab separated is a .tsv
export const isImportable = (settings: TableExportSettings) =>
  settings.delimiter !== '\t' &&
  (Object.keys(IMPORTABLE_SETTINGS) as (keyof TableExportSettings)[]).every(
    (key) => settings[key] === IMPORTABLE_SETTINGS[key],
  )

export const getImportableSettings = (settings: TableExportSettings): TableExportSettings => ({
  ...settings,
  ...IMPORTABLE_SETTINGS,
  delimiter: settings.delimiter === '\t' ? ',' : settings.delimiter,
})

// the message of a failed export response, `data` is its JSON body if it has one
export const getExportErrorMessage = (status: number, statusText: string, data: unknown) => {
  const { detail, errors } = (data || {}) as { detail?: unknown; errors?: { msg?: unknown }[] }
  if (typeof detail !== 'string' || !detail) return `${status} ${statusText}`.trim()
  // request validation errors say what is wrong in `errors`
  const messages = Array.isArray(errors)
    ? errors.flatMap((error) => (typeof error?.msg === 'string' ? [error.msg] : []))
    : []
  return messages.length ? `${detail}: ${messages.join(', ')}` : detail
}

export const CSV_DELIMITERS: { value: CsvDelimiter; label: string }[] = [
  { value: ',', label: 'Comma' },
  { value: ';', label: 'Semicolon' },
  { value: '\t', label: 'Tab' },
]

export const getExportFileName = (
  projectName: string,
  scope: TableExportScope,
  settings: TableExportSettings,
) => {
  const date = new Date().toLocaleDateString('sv') // YYYY-MM-DD in local time
  const extension =
    settings.format === 'xlsx' ? 'xlsx' : settings.delimiter === '\t' ? 'tsv' : 'csv'
  return `${projectName}-${scope === 'table' ? 'table' : 'selection'}-${date}.${extension}`
}

export const downloadUrl = (url: string, fileName: string) => {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  // revoking right away can cancel the download in Safari
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
