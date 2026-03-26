import { parse, unparse, UnparseConfig, UnparseObject, type ParseLocalConfig } from "papaparse"
import { ResolvedColumnMappings, ValueMappings } from "./steps/common"

type ParseAsyncConfig = Omit<ParseLocalConfig, "complete">

export type CSVRow = Record<string, any>

export type ParsedCSV = {
  fileSize: number
  fileName: string
  columns: string[]
  rows: CSVRow[]
}

export type ImportData = ParsedCSV & {
  fileId: string
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

const fileCache = new WeakMap<File, ParsedCSV>()

export const parseCSV = async (file: File) => {
  if (fileCache.has(file)) return fileCache.get(file)!

  const rows = await parseAsync(file, parseConfig)
  const keys = rows.map((r) => Object.keys(r)).flat()
  const columns = Array.from(new Set(keys))
  const result = { columns, rows, fileName: file.name, fileSize: file.size }
  fileCache.set(file, result)

  return result
}

export const serializeCSV = (data: UnparseObject<unknown>) => unparse(data)

export const getFullMapping = (columnMappings: ResolvedColumnMappings, valueMappings: ValueMappings) => {
  return Object.entries(columnMappings).map(([column, columnMapping]) => {
    const valuesMapping = valueMappings[column]
      ? Object.entries(valueMappings[column]).map(([value, { targetValue, action }]) => {
        return {
          source: value,
          target: targetValue,
          action,
        }
      })
      : []

    return {
      sourceKey: column,
      targetKey: columnMapping.targetColumn,
      action: columnMapping.action,
      errorHandlingMode: columnMapping.errorHandlingMode,
      valuesMapping,
    }
  })
}
