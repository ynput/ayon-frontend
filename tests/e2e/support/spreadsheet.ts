import { inflateRawSync } from 'zlib'
import Papa from 'papaparse'

/** Rows of a CSV file as Excel would read it: the UTF-8 BOM is dropped, cells stay text */
export const readCsv = (data: Buffer, delimiter: string): string[][] => {
  const text = data.toString('utf8').replace(/^﻿/, '')
  const { data: rows } = Papa.parse<string[]>(text, { delimiter, skipEmptyLines: true })
  return rows
}

/** The files of a zip archive (stored or deflated), by name */
const unzip = (data: Buffer): Record<string, Buffer> => {
  // the end of central directory record is the last thing in the file (no archive comment here)
  const end = data.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]))
  if (end < 0) throw new Error('not a zip file')
  const count = data.readUInt16LE(end + 10)
  let offset = data.readUInt32LE(end + 16)
  const files: Record<string, Buffer> = {}
  for (let i = 0; i < count; i++) {
    const method = data.readUInt16LE(offset + 10)
    const size = data.readUInt32LE(offset + 20)
    const nameLength = data.readUInt16LE(offset + 28)
    const extraLength = data.readUInt16LE(offset + 30)
    const commentLength = data.readUInt16LE(offset + 32)
    const local = data.readUInt32LE(offset + 42)
    const name = data.toString('utf8', offset + 46, offset + 46 + nameLength)
    const start = local + 30 + data.readUInt16LE(local + 26) + data.readUInt16LE(local + 28)
    const raw = data.subarray(start, start + size)
    files[name] = method === 8 ? inflateRawSync(raw) : raw
    offset += 46 + nameLength + extraLength + commentLength
  }
  return files
}

const unescapeXml = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

const columnIndex = (ref: string) =>
  ref
    .replace(/\d+$/, '')
    .split('')
    .reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1

/** Rows of the first sheet of an .xlsx file, every cell as the text Excel shows (empty cells are '') */
export const readXlsx = (data: Buffer): string[][] => {
  const sheet = unzip(data)['xl/worksheets/sheet1.xml']?.toString('utf8')
  if (!sheet) throw new Error('the workbook has no first sheet')
  const rows: string[][] = []
  for (const [, rowXml] of sheet.matchAll(/<row\b[^>]*>(.*?)<\/row>/gs)) {
    const row: string[] = []
    for (const [, attrs, body] of rowXml.matchAll(/<c\b([^>]*)>(.*?)<\/c>/gs)) {
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1]
      const type = attrs.match(/\bt="(\w+)"/)?.[1]
      if (!ref) continue
      const value =
        type === 'inlineStr'
          ? body.match(/<t\b[^>]*>(.*?)<\/t>/s)?.[1] ?? ''
          : body.match(/<v>(.*?)<\/v>/s)?.[1] ?? ''
      row[columnIndex(ref)] = unescapeXml(type === 'b' ? (value === '1' ? 'TRUE' : 'FALSE') : value)
    }
    rows.push(row)
  }
  // empty cells are not written, so short rows are padded to the header
  const width = Math.max(0, ...rows.map((row) => row.length))
  return rows.map((row) => Array.from({ length: width }, (_, i) => row[i] ?? ''))
}
