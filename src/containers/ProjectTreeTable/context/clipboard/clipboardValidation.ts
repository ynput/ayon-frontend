import { ColumnEnums, builtInFieldMappings, ParsedClipboardData } from './clipboardTypes'
import { clipboardError } from './clipboardUtils'

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
  } = params

  // Skip validation for empty values
  if (!pasteValue) return true

  // Check if the column is read-only
  if (colId.startsWith('attrib_') && columnReadOnly.includes(colId.replace('attrib_', ''))) {
    clipboardError(`This column is read-only: "${colId}". Paste operation cancelled.`)
    return false
  }

  // Special handling for assignees - filter out invalid values instead of canceling
  if (colId === 'assignees') {
    // Split assignees by comma
    const assigneeValues = pasteValue.split(',').map((v) => v.trim())

    // Get assignee options from columnEnums
    const assigneeOptions = columnEnums['assignees'] || []

    // Filter to keep only valid assignees
    const validAssignees = assigneeValues.filter((v) =>
      assigneeOptions.some((opt) => opt.value === v || opt.label === v),
    )

    // Update the paste value in the parsed data
    if (isSingleCellValue) {
      parsedData[0].values[0] = validAssignees.join(', ')
    } else {
      const pasteRowIndex = rowIndex % parsedData.length
      const pasteColIndex = colIndex % parsedData[pasteRowIndex].values.length
      parsedData[pasteRowIndex].values[pasteColIndex] = validAssignees.join(', ')
    }

    return true
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

  // Check if the pasted value exists in the enum options
  const enumValues = pasteValue.split(',').map((v) => v.trim())
  const valueExists = enumValues.every((v) =>
    enumOptions.some((opt) => opt.value === v || opt.label === v),
  )

  if (!valueExists) {
    // Get a display name for the field (folderType/taskType → Type)
    const displayName =
      fieldId === 'folderType' || fieldId === 'taskType'
        ? `${isFolder ? 'folder' : 'task'} type`
        : fieldId

    clipboardError(`Invalid ${displayName} value: "${pasteValue}". Paste operation cancelled.`)
    return false
  }

  return true
}
