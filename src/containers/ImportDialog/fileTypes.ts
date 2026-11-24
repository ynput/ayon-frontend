import type { ImportFileType } from "@ynput/ayon-addon"
import { EXCEL_MIME_TYPE } from "./excel"

// The files the dialog reads: CSV and Excel, and for an addon's import the file types the addon
// reads itself (`ImportTarget.fileTypes`). The addon turns its files into CSV in the browser, so
// the server and the rest of the import only ever see CSV, as for Excel files.

const BUILT_IN_TYPES = [".csv", "text/csv", ".xlsx", EXCEL_MIME_TYPE]

// for the file picker's `accept`
export const acceptedFileTypes = (fileTypes: ImportFileType[] = []) => [
  ...BUILT_IN_TYPES,
  ...fileTypes.flatMap(({ extensions, mimeTypes = [] }) => [...extensions, ...mimeTypes]),
]

// the addon's type of the file, by name ending or media type
export const findFileType = (file: File, fileTypes: ImportFileType[] = []) => {
  const name = file.name.toLowerCase()
  return fileTypes.find(
    ({ extensions, mimeTypes = [] }) =>
      extensions.some((extension) => name.endsWith(extension.toLowerCase())) ||
      (Boolean(file.type) && mimeTypes.includes(file.type)),
  )
}

// "CSV or Excel", "CSV, Excel or calendar"
export const fileKinds = (fileTypes: ImportFileType[] = []) => {
  const kinds = ["CSV", "Excel", ...fileTypes.map(({ label }) => label)]
  return `${kinds.slice(0, -1).join(", ")} or ${kinds[kinds.length - 1]}`
}

// The addon's code may throw anything, the dialog shows an error's message.
export const fileTypeToCSV = async (fileType: ImportFileType, file: File) => {
  try {
    return await fileType.toCSV(file)
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}
