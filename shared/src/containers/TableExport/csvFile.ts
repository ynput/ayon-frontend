// The free export of a selection as shown in the table (context menu without the Power Pack)

export type CsvDelimiter = ',' | ';' | '\t'

export const CSV_DELIMITERS: { value: CsvDelimiter; label: string }[] = [
  { value: ',', label: 'Comma' },
  { value: ';', label: 'Semicolon' },
  { value: '\t', label: 'Tab' },
]

export const getCsvFileName = (projectName: string, delimiter: CsvDelimiter) => {
  const date = new Date().toLocaleDateString('sv') // YYYY-MM-DD in local time
  return `${projectName}-selection-${date}.${delimiter === '\t' ? 'tsv' : 'csv'}`
}

export const downloadUrl = (url: string, fileName: string) => {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  // revoking right away can cancel the download in Safari
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
