import React, { createContext, useContext, useCallback, useMemo, ReactNode, useEffect } from 'react'
import { useSelection } from './SelectionContext'
import { FolderNodeMap, TaskNodeMap } from '../types'
import { parseCellId } from '../utils/cellUtils'
import { useCellEditing } from './CellEditingContext'
import { toast } from 'react-toastify'
import { EntityUpdate } from '../hooks/useUpdateEditorEntities'
import { BuiltInFieldOptions } from '../TableColumns'
import { AttributeEnumItem } from '@api/rest/attributes'

// map fieldId to enum values
const builtInFieldMappings = {
  status: 'statuses',
  folderType: 'folderTypes',
  taskType: 'taskTypes',
}

interface ColumnEnums extends BuiltInFieldOptions {
  [attrib: string]: AttributeEnumItem[]
}

interface ClipboardContextType {
  copyToClipboard: () => Promise<void>
  pasteFromClipboard: () => Promise<void>
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined)

interface ClipboardProviderProps {
  children: ReactNode
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  columnEnums: ColumnEnums
}

export const ClipboardProvider: React.FC<ClipboardProviderProps> = ({
  children,
  foldersMap,
  tasksMap,
  columnEnums,
}) => {
  // Get selection information from SelectionContext
  const { selectedCells, gridMap } = useSelection()
  const { updateEntities } = useCellEditing()

  const clipboardError = (error: string) => toast.error(error)

  // Helper function to get the full path for an entity
  const getEntityPath = useCallback(
    (entityId: string, isFolder: boolean): string => {
      const entity = isFolder ? foldersMap.get(entityId) : tasksMap.get(entityId)
      if (!entity) return ''

      const name = entity.name || ''
      // @ts-ignore
      const parentId = entity.folderId || entity.parentId

      // If no parent, return just the name
      if (!parentId) return name

      // If has parent, get parent path (parents are always folders)
      const parentPath = getEntityPath(parentId, true)

      // Combine paths with " / " separator
      return parentPath ? `${parentPath} / ${name}` : name
    },
    [foldersMap, tasksMap],
  )

  const copyToClipboard = useCallback(async () => {
    if (!selectedCells.size) return

    try {
      // First, organize selected cells by row
      const cellsByRow = new Map<string, Set<string>>()

      // Parse all selected cells and organize by rowId and colId
      Array.from(selectedCells).forEach((cellId) => {
        const position = parseCellId(cellId)
        if (!position) return

        const { rowId, colId } = position

        if (!cellsByRow.has(rowId)) {
          cellsByRow.set(rowId, new Set())
        }
        cellsByRow.get(rowId)?.add(colId)
      })

      // Get sorted row IDs based on their index in the grid
      const sortedRows = Array.from(cellsByRow.keys()).sort((a, b) => {
        const indexA = gridMap.rowIdToIndex.get(a) ?? Infinity
        const indexB = gridMap.rowIdToIndex.get(b) ?? Infinity
        return indexA - indexB
      })

      // Build clipboard text
      let clipboardText = ''

      for (const rowId of sortedRows) {
        // Determine if this is a folder or task by checking which map contains the ID
        const isFolder = foldersMap.has(rowId)
        const entity = isFolder ? foldersMap.get(rowId) : tasksMap.get(rowId)

        if (!entity) continue

        // Get all column IDs for this row, sorted by their index in the grid
        const colIds = Array.from(cellsByRow.get(rowId) || []).sort((a, b) => {
          const indexA = gridMap.colIdToIndex.get(a) ?? Infinity
          const indexB = gridMap.colIdToIndex.get(b) ?? Infinity
          return indexA - indexB
        })

        const rowValues: string[] = []

        // For each column in this row
        for (const colId of colIds) {
          // Determine the value based on the column ID
          let cellValue = ''
          // @ts-ignore
          const foundValue = entity[colId] || entity.attrib?.[colId]
          cellValue = foundValue !== undefined && foundValue !== null ? String(foundValue) : ''

          // Special handling for name field - include full path
          if (colId === 'name') {
            cellValue = getEntityPath(rowId, isFolder)
          }

          if (colId === 'subType') {
            // get folderType or taskType
            // @ts-ignore
            cellValue = entity[isFolder ? 'folderType' : 'taskType'] || ''
          }

          // Escape double quotes in the cell value and wrap in quotes
          rowValues.push(`${cellValue.replace(/"/g, '""')}`)
        }

        // Add row to clipboard text
        clipboardText += rowValues.join('\t') + '\n'
      }

      // Write to clipboard using the Clipboard API
      await navigator.clipboard.writeText(clipboardText)
      console.log('Copied to clipboard successfully', clipboardText)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }, [selectedCells, foldersMap, tasksMap, gridMap, getEntityPath])

  const parseClipboardText = useCallback((clipboardText: string) => {
    // Parse clipboard text into rows and columns
    const rows = clipboardText.trim().split('\n')
    const parsedData: { values: string[]; colIds: string[] }[] = []

    // Track column IDs from the copied data
    const firstRowValues = rows[0].split('\t')

    // Store original column order for validation
    const origColumnOrder: string[] = []

    // Parse each row into values
    rows.forEach((row) => {
      const rowValues = row.split('\t')
      parsedData.push({ values: rowValues, colIds: origColumnOrder })
    })

    return parsedData
  }, [])

  const pasteFromClipboard = useCallback(async () => {
    if (!selectedCells.size) return

    try {
      // Get text from clipboard
      const clipboardText = await navigator.clipboard.readText()
      if (!clipboardText.trim()) return

      // Parse the clipboard text
      const parsedData = parseClipboardText(clipboardText)
      if (!parsedData.length) return

      // Organize selected cells by row
      const cellsByRow = new Map<string, Set<string>>()

      // Parse all selected cells and organize by rowId and colId
      Array.from(selectedCells).forEach((cellId) => {
        const position = parseCellId(cellId)
        if (!position) return

        const { rowId, colId } = position

        if (!cellsByRow.has(rowId)) {
          cellsByRow.set(rowId, new Set())
        }
        cellsByRow.get(rowId)?.add(colId)
      })

      // Get sorted row IDs based on their index in the grid
      const sortedRows = Array.from(cellsByRow.keys()).sort((a, b) => {
        const indexA = gridMap.rowIdToIndex.get(a) ?? Infinity
        const indexB = gridMap.rowIdToIndex.get(b) ?? Infinity
        return indexA - indexB
      })

      // For each row, get the sorted column IDs
      const firstRow = sortedRows[0]
      const selectedColIds = Array.from(cellsByRow.get(firstRow) || []).sort((a, b) => {
        const indexA = gridMap.colIdToIndex.get(a) ?? Infinity
        const indexB = gridMap.colIdToIndex.get(b) ?? Infinity
        return indexA - indexB
      })

      // Validate column count matches
      if (parsedData[0].values.length !== selectedColIds.length) {
        clipboardError('Column count mismatch between copied and selected cells.')
        return
      }

      // First pass: validate all values for status and subType
      for (let colIndex = 0; colIndex < selectedColIds.length; colIndex++) {
        const colId = selectedColIds[colIndex]

        for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
          const rowId = sortedRows[rowIndex]
          const isFolder = foldersMap.has(rowId)

          // Get the appropriate value from the clipboard data
          const pasteRowIndex = rowIndex % parsedData.length
          const pasteValue = parsedData[pasteRowIndex].values[colIndex]

          // skip validation for empty values - these will be silently skipped later for enum fields
          if (!pasteValue) continue

          // Map subType to the actual field name
          let fieldId = colId === 'subType' ? (isFolder ? 'folderType' : 'taskType') : colId
          // check if fieldId has a mapping to plural enum
          // @ts-expect-error
          fieldId = builtInFieldMappings[fieldId] || fieldId

          // Skip validation for fields that don't have enums
          if (!(fieldId in columnEnums)) continue

          // Get the enum values for this field
          const enumOptions = columnEnums[fieldId as keyof typeof columnEnums]

          // Skip if no enum options are available
          if (!Array.isArray(enumOptions) || enumOptions.length === 0) continue

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

            clipboardError(
              `Invalid ${displayName} value: "${pasteValue}". Paste operation cancelled.`,
            )
            return
          }
        }
      }

      // Create a map to consolidate updates for the same entity
      const entitiesMap = new Map<
        string,
        {
          id: string
          type: string
          fields: Record<string, any>
          attrib: Record<string, any>
        }
      >()

      // For each column, prepare updates
      for (let colIndex = 0; colIndex < selectedColIds.length; colIndex++) {
        const colId = selectedColIds[colIndex]

        // Skip special handling for 'name' which we don't want to paste
        if (colId === 'name') continue

        // Check if this is an attribute field by examining the first entity
        let isAttrib = false
        // Check if the field potentially contains array values
        let isArrayField = false
        let fieldValueType: 'string' | 'number' | 'boolean' | 'array' = 'string'

        if (sortedRows.length > 0) {
          const firstRowId = sortedRows[0]
          const isFolder = foldersMap.has(firstRowId)
          const entity = isFolder ? foldersMap.get(firstRowId) : tasksMap.get(firstRowId)

          if (entity) {
            isAttrib = !(colId in entity) && entity.attrib && colId in entity.attrib

            // Determine if field is an array and its value type
            // @ts-ignore - Check entity property or attribute
            const fieldValue = isAttrib ? entity.attrib[colId] : entity[colId]
            if (Array.isArray(fieldValue)) {
              isArrayField = true
              fieldValueType = 'array'
            } else if (typeof fieldValue === 'number') {
              fieldValueType = 'number'
            } else if (typeof fieldValue === 'boolean') {
              fieldValueType = 'boolean'
            }

            // Special case for subType
            if (colId === 'subType') {
              isAttrib = false
            }
          }
        }

        // Process each row individually
        for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
          const rowId = sortedRows[rowIndex]
          const isFolder = foldersMap.has(rowId)
          const entityType = isFolder ? 'folder' : 'task'

          // Get the appropriate value from the clipboard data
          const pasteRowIndex = rowIndex % parsedData.length
          let pasteValue = parsedData[pasteRowIndex].values[colIndex]

          let fieldToUpdate = colId
          let processedValue: any

          // Special handling for subType (convert to folderType or taskType)
          if (colId === 'subType') {
            fieldToUpdate = isFolder ? 'folderType' : 'taskType'
            processedValue = pasteValue
            isAttrib = false

            // Skip empty values for enum fields
            if (!pasteValue) continue
          } else {
            // Check if this is an enum field with empty value (validation case 2)
            let enumFieldId =
              builtInFieldMappings[fieldToUpdate as keyof typeof builtInFieldMappings] ||
              fieldToUpdate
            if (
              !pasteValue &&
              enumFieldId in columnEnums &&
              Array.isArray(columnEnums[enumFieldId as keyof typeof columnEnums]) &&
              columnEnums[enumFieldId as keyof typeof columnEnums].length > 0
            ) {
              continue // Skip adding this field to updates - silent skip for empty enum values
            }

            // Process value based on detected field type
            if (isArrayField) {
              try {
                // Try to parse as JSON first (for copied arrays)
                try {
                  processedValue = JSON.parse(pasteValue)
                } catch {
                  // If not valid JSON, treat as comma-separated values
                  processedValue = pasteValue.includes(',')
                    ? pasteValue.split(',').map((v) => v.trim())
                    : [pasteValue]
                }
                processedValue = Array.isArray(processedValue) ? processedValue : [processedValue]
              } catch {
                // Fallback to single-item array if parsing fails
                processedValue = [pasteValue]
              }
            } else if (fieldValueType === 'number') {
              processedValue = Number(pasteValue) || 0
            } else if (fieldValueType === 'boolean') {
              processedValue =
                pasteValue.toLowerCase() === 'true' ||
                pasteValue === '1' ||
                pasteValue.toLowerCase() === 'yes'
            } else {
              // Default string handling
              processedValue = pasteValue
            }
          }

          // Get or create entity entry in the map
          const entityKey = `${rowId}-${entityType}`
          if (!entitiesMap.has(entityKey)) {
            entitiesMap.set(entityKey, {
              id: rowId,
              type: entityType,
              fields: {},
              attrib: {},
            })
          }

          const entityData = entitiesMap.get(entityKey)!

          // Add the field to the appropriate place
          if (isAttrib) {
            entityData.attrib[fieldToUpdate] = processedValue
          } else {
            entityData.fields[fieldToUpdate] = processedValue
          }
        }
      }

      // Convert the consolidated map to EntityUpdate array
      const allEntityUpdates: EntityUpdate[] = []

      entitiesMap.forEach((entity) => {
        // For regular fields, create one update per field
        Object.entries(entity.fields).forEach(([field, value]) => {
          allEntityUpdates.push({
            id: entity.id,
            type: entity.type,
            field,
            value,
          })
        })

        // For attributes, create one update per attribute
        Object.entries(entity.attrib).forEach(([field, value]) => {
          allEntityUpdates.push({
            id: entity.id,
            type: entity.type,
            field,
            value,
            isAttrib: true,
          })
        })
      })

      // Make a single call to update all entities
      if (allEntityUpdates.length > 0) {
        try {
          await updateEntities(allEntityUpdates)
        } catch (error) {
          console.error('Error updating entities:', error)
          clipboardError(
            `Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
        }
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error)
      clipboardError('Failed to paste data. Please try again.')
    }
  }, [
    selectedCells,
    gridMap,
    foldersMap,
    tasksMap,
    updateEntities,
    parseClipboardText,
    columnEnums,
  ])

  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy functionality (Ctrl+C or Command+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copyToClipboard()
      }

      // Paste functionality (Ctrl+V or Command+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteFromClipboard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [copyToClipboard, pasteFromClipboard])

  const value = useMemo(
    () => ({
      copyToClipboard,
      pasteFromClipboard,
    }),
    [copyToClipboard, pasteFromClipboard],
  )

  return <ClipboardContext.Provider value={value}>{children}</ClipboardContext.Provider>
}

export const useClipboard = (): ClipboardContextType => {
  const context = useContext(ClipboardContext)
  if (context === undefined) {
    throw new Error('useClipboard must be used within a ClipboardProvider')
  }
  return context
}
