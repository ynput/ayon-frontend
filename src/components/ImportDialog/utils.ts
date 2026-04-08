import { parse, unparse, UnparseObject, type ParseLocalConfig } from "papaparse"
import { ColumnMappings, ErrorHandlingMode, ValueMappings } from "./steps/common"
import { parseUniqueValueIfHierarchy } from "./steps/hierarchy"
import { ColumnMapping as ServerColumnMapping } from "@shared/api/generated/dataImport"

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
  skipEmptyLines: "greedy",
}

const parseAsync = (file: File | string, config: ParseAsyncConfig): Promise<CSVRow[]> => new Promise((resolve, reject) => {
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
const textEncoder = new TextEncoder()

export const parseCSV = async (file: File | string) => {
  if (typeof file === "object" && fileCache.has(file)) return fileCache.get(file)!

  const rows = await parseAsync(file, parseConfig)
  const keys = rows.map((r) => Object.keys(r)).flat()
  const columns = Array.from(new Set(keys))
  const result = {
    columns,
    rows,
    fileName: typeof file === "object" ? file.name : "Pasted from clipboard",
    fileSize: typeof file === "object" ? file.size : textEncoder.encode(file).length,
  }

  if (typeof file === "object") {
    fileCache.set(file, result)
  }

  return result
}

export const serializeCSV = (data: UnparseObject<unknown>) => unparse(data)

export const getFullMapping = (columnMappings: ColumnMappings, valueMappings: ValueMappings): ServerColumnMapping[] => {
  return Object.entries(columnMappings).map(([column, columnMapping]) => {
    const valuesMapping = valueMappings[column]
      ? Object.entries(valueMappings[column]).map(([value, { targetValue, action }]) => {
        const { source, entityType } = parseUniqueValueIfHierarchy(columnMapping.targetColumn ?? null, value)
        // the backend expects a string and coerces it into a boolean
        const target = typeof targetValue === "boolean"
          ? (targetValue ? "true" : "false")
          : targetValue

        return {
          source,
          target,
          action,
          entityType,
        }
      })
      : []

    return {
      sourceKey: column,
      targetKey: columnMapping.targetColumn ?? "",
      action: columnMapping.action,
      errorHandlingMode: columnMapping.errorHandlingMode ?? ErrorHandlingMode.SKIP,
      valuesMapping,
    }
  })
}

const humanReadableDataType: Record<string, string> = {
  "string": "Text",
  "enum": "Select",
  "list_of_strings": "Multi-select",
  "list_of_any": "Multi-select",
  "list_of_dict": "Multi-select",
  "list_of_integers": "Multi-select (whole number)",
  "list_of_submodels": "Multi-select",
  "integer": "Whole Number",
  "float": "Number with decimals",
  "datetime": "Date and time",
  "boolean": "Checkbox",
}

const listDataTypes = new Set([
  "list_of_strings",
  "list_of_any",
  "list_of_dict",
  "list_of_integers",
  "list_of_submodels",
])

export const formatDataType = (t: string, isEnum: boolean) => {
  if (isEnum && !listDataTypes.has(t)) {
    return humanReadableDataType["enum"]
  }

  return humanReadableDataType[t] ?? t.replace(/_/g, ' ')
}
