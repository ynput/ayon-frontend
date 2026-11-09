import { unparse } from "papaparse"
import type { CellValue, Row, Sheet } from "read-excel-file/browser"

// Excel files are read in the browser and the chosen sheet is converted to CSV,
// so the server and the rest of the import only ever see CSV.

export const EXCEL_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

export type ExcelSheet = {
  name: string
  // the first row is the header
  rows: Row[]
}

export const isExcelFile = (file: File) =>
  file.type === EXCEL_MIME_TYPE || /\.xlsx$/i.test(file.name)

const pad = (n: number) => String(n).padStart(2, "0")

// Cells hold the wall-clock date and time as UTC. A date without a time stays a date,
// the review step reads both like typed dates.
const formatDate = (date: Date) => {
  const day = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
  const [h, m, s] = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
  if (h === 0 && m === 0 && s === 0) return day
  return `${day} ${pad(h)}:${pad(m)}:${pad(s)}`
}

const formatCell = (cell: CellValue | null) => {
  if (cell === null || cell === undefined) return ""
  if (cell instanceof Date) return formatDate(cell)
  return String(cell)
}

const isEmptyRow = (row: Row) =>
  row.every((cell) => cell === null || cell === undefined || cell === "")

// Sheets without any rows (charts, notes, empty tabs) can't be imported, so they are left out.
export const readExcelSheets = async (file: File): Promise<ExcelSheet[]> => {
  // the reader is only needed here, keep it out of the main bundle
  const { default: readXlsxFile } = await import("read-excel-file/browser")
  const sheets: Sheet[] = await readXlsxFile(file)
  return sheets
    .map(({ sheet, data }) => ({ name: sheet, rows: data.filter((row) => !isEmptyRow(row)) }))
    .filter(({ rows }) => rows.length > 0)
}

export const excelSheetToCSV = ({ rows }: ExcelSheet) =>
  unparse(rows.map((row) => row.map(formatCell)))
