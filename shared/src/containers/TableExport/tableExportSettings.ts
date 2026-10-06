export type TableExportScope = 'selection' | 'table'
export type TableExportFormat = 'xlsx' | 'csv'
export type CsvDelimiter = ',' | ';' | '\t'

export type TableExportSettings = {
  format: TableExportFormat
  delimiter: CsvDelimiter
  header: 'label' | 'key' // column names: labels as in the table, or field names
  values: 'label' | 'value' // enum labels, full names, readable dates; or raw values
  includeImportColumns: boolean // entity type and path, needed to import the file back
  selectionColumns: 'selected' | 'visible'
}

export const TABLE_EXPORT_SETTINGS_KEY = 'table-export-settings'

export const DEFAULT_TABLE_EXPORT_SETTINGS: TableExportSettings = {
  format: 'xlsx',
  delimiter: ',',
  header: 'label',
  values: 'label',
  includeImportColumns: false,
  selectionColumns: 'selected',
}

// what Import CSV needs to read a hierarchy export back
export const IMPORTABLE_SETTINGS: Partial<TableExportSettings> = {
  format: 'csv',
  header: 'key',
  values: 'value',
  includeImportColumns: true,
}

export const isImportable = (settings: TableExportSettings) =>
  (Object.keys(IMPORTABLE_SETTINGS) as (keyof TableExportSettings)[]).every(
    (key) => settings[key] === IMPORTABLE_SETTINGS[key],
  )

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
  URL.revokeObjectURL(url)
}
