import { validateEntityId } from '@shared/util'
import { ColumnEnums, builtInFieldMappings, ParsedClipboardData } from './clipboardTypes'
import { clipboardError } from './clipboardUtils'

// Columns that should have case-insensitive matching and value correction like assignees
const CASE_INSENSITIVE_COLUMNS = ['assignees', 'status', 'subType']

// Validate clipboard data for enum fields and handle special cases
export const validateClipboardData = (params: {
  colId: string
  isFolder: boolean
  pasteValue: string
  parsedData: ParsedClipboardData[]
  columnEnums: ColumnEnums
  columnReadOnly: string[]
  rowIndex: number
  colIndex: number
  isSingleCellValue: boolean
  attribFields?: Array<{
    name: string
    data: { type: string; enum?: Array<{ value: string | number | boolean; label: string }> }
  }>
}): boolean => {
  const {
    colId,
    isFolder,
    pasteValue,
    parsedData,
    columnEnums,
    columnReadOnly,
    rowIndex,
    colIndex,
    isSingleCellValue,
    attribFields = [],
  } = params

  // Skip validation for empty values
  if (!pasteValue) return true

  // Check if the column is read-only
  if (columnReadOnly.includes(colId.replace('attrib_', ''))) {
    clipboardError(`This column is read-only: "${colId}". Paste operation cancelled.`)
    return false
  }

  // special handling for links
  if (colId.startsWith('link_')) {
    // Split entity Ids by comma
    const entityIds = pasteValue.split(',').map((v) => v.trim())

    // check every id is valid
    const isValid = entityIds.every((id) => validateEntityId(id))
    if (isValid) return true
    else {
      clipboardError(`Invalid link id format: "${pasteValue}". Paste operation cancelled.`)
      return false
    }
  }

  // Special handling for columns that should have case-insensitive matching
  if (CASE_INSENSITIVE_COLUMNS.includes(colId)) {
    // Determine the enum key based on the column
    let enumKey = colId
    if (colId === 'assignees') {
      enumKey = 'assignee' // assignees uses 'assignee' enum key
    } else if (colId === 'subType') {
      enumKey = isFolder ? 'folderType' : 'taskType'
    } else if (colId === 'status') {
      enumKey = 'status'
    }

    // Get enum options
    const enumOptions = columnEnums[enumKey as keyof typeof columnEnums] || []

    if (enumOptions.length === 0) {
      // If no enum options available, skip validation
      return true
    }

    // Split values by comma
    const inputValues = pasteValue.split(',').map((v) => v.trim())
    const validValues: string[] = []

    for (const v of inputValues) {
      // First try exact match
      const exactMatch = enumOptions.find((opt) => opt.value === v || opt.label === v)
      if (exactMatch) {
        validValues.push(String(exactMatch.value))
        continue
      }

      // Try case-insensitive match
      const caseInsensitiveMatch = enumOptions.find(
        (opt) =>
          String(opt.value).toLowerCase() === v.toLowerCase() ||
          String(opt.label).toLowerCase() === v.toLowerCase(),
      )
      if (caseInsensitiveMatch) {
        validValues.push(String(caseInsensitiveMatch.value))
        continue
      }

      // For assignees, skip invalid values instead of failing
      if (colId === 'assignees') {
        // Skip invalid assignees
      } else {
        // For other columns, fail validation
        const displayName = colId === 'subType'
          ? `${isFolder ? 'folder' : 'task'} type`
          : colId === 'status'
          ? 'status'
          : colId
        clipboardError(`Invalid ${displayName} value: "${pasteValue}". Paste operation cancelled.`)
        return false
      }
    }

    // For assignees, require at least one valid value
    if (colId === 'assignees' && validValues.length === 0) {
      clipboardError(
        `Invalid assignee value: "${pasteValue}". No matching assignees found. Paste operation cancelled.`,
      )
      return false
    }

    // Update the paste value in the parsed data with corrected case
    const correctedValue = validValues.join(', ')

    if (correctedValue !== pasteValue) {
      if (isSingleCellValue) {
        parsedData[0].values[0] = correctedValue
      } else {
        const pasteRowIndex = rowIndex % parsedData.length
        const pasteColIndex = colIndex % parsedData[pasteRowIndex].values.length
        parsedData[pasteRowIndex].values[pasteColIndex] = correctedValue
      }
    }

    return true
  }

  // Validate attribute fields with specific type validation
  if (colId.startsWith('attrib_')) {
    const attributeName = colId.replace('attrib_', '')
    const attribute = attribFields.find((attr) => attr.name === attributeName)

    if (attribute) {
      // Number field validation (integer/float attributes)
      if (attribute.data.type === 'integer' || attribute.data.type === 'float') {
        // Check if the pasted value is a valid number
        const trimmedValue = pasteValue.trim()
        const isValidNumber = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(trimmedValue)

        if (!isValidNumber) {
          const fieldType = attribute.data.type === 'integer' ? 'integer' : 'number'
          clipboardError(
            `Invalid ${fieldType} value: "${pasteValue}". Must be a valid ${fieldType}. Paste operation cancelled.`,
          )
          return false
        }

        // For integer fields, check that it's actually an integer
        if (attribute.data.type === 'integer') {
          const num = parseFloat(trimmedValue)
          if (!Number.isInteger(num)) {
            clipboardError(
              `Invalid integer value: "${pasteValue}". Must be a whole number. Paste operation cancelled.`,
            )
            return false
          }
        }

        return true
      }

      // String enum validation for attributes with enum options
      if (
        attribute.data.type === 'string' &&
        attribute.data.enum &&
        attribute.data.enum.length > 0
      ) {
        const enumValues = pasteValue.split(',').map((v) => v.trim())

        // Try to match each value, with fallback to case-insensitive matching
        const { validValues, hasInvalidValues } = enumValues.reduce(
          (acc, v) => {
            // First try exact match
            const exactMatch = attribute.data.enum!.find(
              (opt) => opt.value === v || opt.label === v,
            )
            if (exactMatch) {
              acc.validValues.push(String(exactMatch.value))
              return acc
            }

            // Try case-insensitive match
            const caseInsensitiveMatch = attribute.data.enum!.find(
              (opt) =>
                String(opt.value).toLowerCase() === v.toLowerCase() ||
                String(opt.label).toLowerCase() === v.toLowerCase(),
            )
            if (caseInsensitiveMatch) {
              acc.validValues.push(String(caseInsensitiveMatch.value))
              return acc
            }

            // No match found
            acc.hasInvalidValues = true
            acc.validValues.push(v) // Keep original value for error message
            return acc
          },
          { validValues: [] as string[], hasInvalidValues: false },
        )

        if (hasInvalidValues) {
          clipboardError(
            `Invalid ${attributeName} value: "${pasteValue}". Must be one of the available options. Paste operation cancelled.`,
          )
          return false
        }

        // Update the paste value with corrected case if any corrections were made
        const correctedValue = validValues.join(', ')
        if (correctedValue !== pasteValue) {
          if (isSingleCellValue) {
            parsedData[0].values[0] = correctedValue
          } else {
            const pasteRowIndex = rowIndex % parsedData.length
            const pasteColIndex = colIndex % parsedData[pasteRowIndex].values.length
            parsedData[pasteRowIndex].values[pasteColIndex] = correctedValue
          }
        }

        return true
      }
    }
  }

  // Map subType to the actual field name
  let fieldId = colId === 'subType' ? (isFolder ? 'folderType' : 'taskType') : colId
  // Check if fieldId has a mapping to plural enum
  fieldId = builtInFieldMappings[fieldId as keyof typeof builtInFieldMappings] || fieldId

  // Skip validation for fields that don't have enums
  if (!(fieldId in columnEnums)) return true

  // Get the enum values for this field
  const enumOptions = columnEnums[fieldId as keyof typeof columnEnums]

  // Skip if no enum options are available
  if (!Array.isArray(enumOptions) || enumOptions.length === 0) return true

  // Check if the pasted value exists in the enum options with case-insensitive matching
  const enumValues = pasteValue.split(',').map((v) => v.trim())

  // Try to match each value, with fallback to case-insensitive matching
  const { validValues, hasInvalidValues } = enumValues.reduce(
    (acc, v) => {
      // First try exact match
      const exactMatch = enumOptions.find((opt) => opt.value === v || opt.label === v)
      if (exactMatch) {
        acc.validValues.push(String(exactMatch.value))
        return acc
      }

      // Try case-insensitive match
      const caseInsensitiveMatch = enumOptions.find(
        (opt) =>
          String(opt.value).toLowerCase() === v.toLowerCase() ||
          String(opt.label).toLowerCase() === v.toLowerCase(),
      )
      if (caseInsensitiveMatch) {
        acc.validValues.push(String(caseInsensitiveMatch.value))
        return acc
      }

      // No match found
      acc.hasInvalidValues = true
      acc.validValues.push(v) // Keep original value for error message
      return acc
    },
    { validValues: [] as string[], hasInvalidValues: false },
  )

  if (hasInvalidValues) {
    // Get a display name for the field (folderType/taskType → Type)
    const displayName =
      fieldId === 'folderType' || fieldId === 'taskType'
        ? `${isFolder ? 'folder' : 'task'} type`
        : fieldId

    clipboardError(`Invalid ${displayName} value: "${pasteValue}". Paste operation cancelled.`)
    return false
  }

  // Update the paste value with corrected case if any corrections were made
  const correctedValue = validValues.join(', ')
  if (correctedValue !== pasteValue) {
    if (isSingleCellValue) {
      parsedData[0].values[0] = correctedValue
    } else {
      const pasteRowIndex = rowIndex % parsedData.length
      const pasteColIndex = colIndex % parsedData[pasteRowIndex].values.length
      parsedData[pasteRowIndex].values[pasteColIndex] = correctedValue
    }
  }

  return true
}
