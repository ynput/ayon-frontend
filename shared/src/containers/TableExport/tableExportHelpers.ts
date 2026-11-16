import type { TableExportOptions } from '@shared/context'

// added to the labels of the columns an importable export leaves out
export const NOT_IMPORTABLE = "(Import CSV can't read it)"

// the dialog's importable file: a raw CSV with the import columns
export const isForImport = ({ includeImportColumns, format, content }: TableExportOptions) =>
  includeImportColumns && format === 'csv' && content === 'raw'
