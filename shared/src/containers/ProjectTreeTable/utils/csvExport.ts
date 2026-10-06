export type CsvDelimiter = ',' | ';' | '\t'

export const CSV_DELIMITERS: { value: CsvDelimiter; label: string }[] = [
  { value: ',', label: 'Comma separated (.csv)' },
  { value: ';', label: 'Semicolon separated (.csv)' },
  { value: '\t', label: 'Tab separated (.tsv)' },
]

// table column id -> hierarchy export field key (GET /api/csv/export/hierarchy/fields)
// entity type and path always come first, the name column adds the label shown next to it
const COLUMN_EXPORT_KEYS: Record<string, string> = {
  name: 'label',
  subType: 'folder_or_task_type',
  status: 'status',
  assignees: 'assignees',
  tags: 'tags',
}

export const getExportColumnKeys = (columnIds: string[]): string[] =>
  Array.from(
    new Set(
      columnIds.flatMap((id) => {
        if (id.startsWith('attrib_')) return [`attrib.${id.slice('attrib_'.length)}`]
        const key = COLUMN_EXPORT_KEYS[id]
        return key ? [key] : []
      }),
    ),
  )

export const getCsvFileName = (projectName: string, scope: string, delimiter: CsvDelimiter) => {
  const date = new Date().toLocaleDateString('sv') // YYYY-MM-DD in local time
  return `${projectName}-${scope}-${date}.${delimiter === '\t' ? 'tsv' : 'csv'}`
}

export const downloadTextFile = (text: string, fileName: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
