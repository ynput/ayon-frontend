import type { ImportFileType } from "@ynput/ayon-addon"
import { EXCEL_MIME_TYPE } from "./excel"

// The files the dialog reads: CSV and Excel, and for an addon's import the file types the addon
// reads itself (`ImportTarget.fileTypes`). The addon turns its files into CSV in the browser, so
// the server and the rest of the import only ever see CSV, as for Excel files.

const BUILT_IN_EXTENSIONS = [".csv", ".xlsx"]
const BUILT_IN_TYPES = [...BUILT_IN_EXTENSIONS, "text/csv", EXCEL_MIME_TYPE]

const hasExtension = (name: string, extensions: string[]) =>
  extensions.some((extension) => name.toLowerCase().endsWith(extension.toLowerCase()))

// For the file picker's `accept`. A dropped file is checked against the list as it is, so the
// addon's extensions are there in upper case too ("WORK.ICS").
export const acceptedFileTypes = (fileTypes: ImportFileType[] = []) => [
  ...BUILT_IN_TYPES,
  ...fileTypes.flatMap(({ extensions, mimeTypes = [] }) => [
    ...new Set([...extensions, ...extensions.map((extension) => extension.toUpperCase())]),
    ...mimeTypes,
  ]),
]

// The addon's type of the file, by name ending, else by media type. A CSV or Excel file is the
// dialog's own whatever media type the browser gives it.
export const findFileType = (file: File, fileTypes: ImportFileType[] = []) =>
  fileTypes.find(({ extensions }) => hasExtension(file.name, extensions)) ??
  (hasExtension(file.name, BUILT_IN_EXTENSIONS) || !file.type
    ? undefined
    : fileTypes.find(({ mimeTypes = [] }) => mimeTypes.includes(file.type)))

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
