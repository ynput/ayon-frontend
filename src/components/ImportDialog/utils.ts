import { parse, type ParseLocalConfig } from "papaparse"

type ParseAsyncConfig = Omit<ParseLocalConfig, "complete">

export type CSVRow = Record<string, any>

export type ImportData = {
  fileName: string
  columns: string[]
  rows: CSVRow[]
}

const parseConfig: ParseAsyncConfig = {
  dynamicTyping: true,
  header: true,
}

const parseAsync = (file: File, config: ParseAsyncConfig): Promise<CSVRow[]> => new Promise((resolve, reject) => {
  parse(
    // @ts-expect-error some weirdness with the overloads, we're passing a File which should be fine
    file,
    {
      ...config,
      complete: ({ data, errors }) => {
        if (errors.length > 1) {
          return reject(JSON.stringify(errors))
        }
        resolve(data)
      }
    },
  )
})

const fileCache = new WeakMap<File, ImportData>()

export const parseCSV = async (file: File) => {
  if (fileCache.has(file)) return fileCache.get(file)!

  const rows = await parseAsync(file, parseConfig)
  const keys = rows.map((r) => Object.keys(r)).flat()
  const columns = Array.from(new Set(keys))
  const result = { columns, rows, fileName: file.name }
  fileCache.set(file, result)

  return result
}
