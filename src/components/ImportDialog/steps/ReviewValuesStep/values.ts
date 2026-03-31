import { ImportableColumn } from "@shared/api/generated/dataImport"
import { ImportData } from "../../utils"

const possibleDelimiters = [
  ",",
  ";",
  "/",
  "|",
  "\t",
  "\n",
  " ",
]

const tryParseJSONArray = (text: string) => {
  const array = JSON.parse(text)
  if (!Array.isArray(array)) throw new Error()
  return array
}

const extractListOfStrings = (text: string) => {
  try {
    let array = []
    try {
      array = tryParseJSONArray(text)
    } catch {
      array = tryParseJSONArray(text.replaceAll("'", '"'))
    }
    return array
  } catch {
    for (const delimiter of possibleDelimiters) {
      const parts = text.split(delimiter)
      if (parts.length === 0) continue

      return parts.map((p) => p.trim())
    }
  }

  return []
}

// Returns all values found in `data` for a given column based on its settings.
// For columns of type `list_of_string`, it tries to parse each value as a JSON array,
// then a plain list with various separators.
export const getValuesForColumn = (data: ImportData, column: string, settings: ImportableColumn) => {
  if (settings.valueType === "list_of_strings") {
    return data.rows
      .map((row) => {
        if (!row[column]) return []
        return extractListOfStrings(`${row[column]}`)
      })
      .flat()
  }

  return data.rows.map((row) => {
    switch (typeof row[column]) {
      case "undefined":
        return undefined
      case "object":
        // coerce null to undefined
        return row[column] ?? undefined
      default:
        return `${row[column]}`
    }
  })
}
