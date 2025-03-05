import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react'
import { useSelection } from './SelectionContext'
import { useCellEditing } from './CellEditingContext'
import { getCellValue, parseCellId } from '../utils/cellUtils'
import { EntityUpdate } from '../hooks/useUpdateEditorEntities'

// Import from the new modular files
import {
  getEntityPath,
  parseClipboardText,
  clipboardError,
  processFieldValue,
} from './clipboard/clipboardUtils'
import { validateClipboardData } from './clipboard/clipboardValidation'
import { ClipboardContextType, ClipboardProviderProps } from './clipboard/clipboardTypes'

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined)

export const ClipboardProvider: React.FC<ClipboardProviderProps> = ({
  children,
  foldersMap,
  tasksMap,
  columnEnums,
}) => {
  // Get selection information from SelectionContext
  const { selectedCells, gridMap } = useSelection()
  const { updateEntities } = useCellEditing()

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
          const foundValue = getCellValue(entity, colId)
          cellValue = foundValue !== undefined && foundValue !== null ? String(foundValue) : ''

          // Special handling for name field - include full path
          if (colId === 'name') {
            cellValue = getEntityPath(rowId, isFolder, foldersMap, tasksMap)
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
  }, [selectedCells, foldersMap, tasksMap, gridMap])

  const pasteFromClipboard = useCallback(async () => {
    if (!selectedCells.size) return

    try {
      // Get text from clipboard
      const clipboardText = await navigator.clipboard.readText()
      if (!clipboardText.trim()) return

      // Parse the clipboard text
      const parsedData = parseClipboardText(clipboardText)
      if (!parsedData.length) return

      // Determine if we have a single value in the clipboard (one row, one column)
      const isSingleCellValue = parsedData.length === 1 && parsedData[0].values.length === 1

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

      // First pass: validate all values for status and subType
      for (let colIndex = 0; colIndex < selectedColIds.length; colIndex++) {
        const colId = selectedColIds[colIndex]

        for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
          const rowId = sortedRows[rowIndex]
          const isFolder = foldersMap.has(rowId)

          // Get the appropriate value from the clipboard data
          // If it's a single cell value, use it for all cells
          // Otherwise use the modulo approach to repeat values
          let pasteValue
          if (isSingleCellValue) {
            pasteValue = parsedData[0].values[0]
          } else {
            const pasteRowIndex = rowIndex % parsedData.length
            const pasteColIndex = colIndex % parsedData[pasteRowIndex].values.length
            pasteValue = parsedData[pasteRowIndex].values[pasteColIndex]
          }

          // Validate clipboard data for this cell
          const isValid = validateClipboardData(
            colId,
            isFolder,
            pasteValue,
            parsedData,
            columnEnums,
            rowIndex,
            colIndex,
            isSingleCellValue,
          )

          if (!isValid) return
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
        let fieldValueType: 'string' | 'number' | 'boolean' | 'array' = 'string'

        if (sortedRows.length > 0) {
          const firstRowId = sortedRows[0]
          const isFolder = foldersMap.has(firstRowId)
          const entity = isFolder ? foldersMap.get(firstRowId) : tasksMap.get(firstRowId)

          if (entity) {
            isAttrib = colId.startsWith('attrib_')

            // Determine if field is an array and its value type
            // @ts-ignore - Check entity property or attribute
            const fieldValue = getCellValue(entity, colId)
            if (Array.isArray(fieldValue)) {
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
          let pasteValue
          if (isSingleCellValue) {
            pasteValue = parsedData[0].values[0]
          } else {
            const pasteRowIndex = rowIndex % parsedData.length
            const pasteColIndex = colIndex % parsedData[pasteRowIndex].values.length
            pasteValue = parsedData[pasteRowIndex].values[pasteColIndex]
          }

          let fieldToUpdate = colId.split('_').pop() || colId

          // Special handling for subType (convert to folderType or taskType)
          if (colId === 'subType') {
            fieldToUpdate = isFolder ? 'folderType' : 'taskType'
            isAttrib = false

            // Skip empty values for enum fields
            if (!pasteValue) continue
          }

          // Process the value based on its type
          const processedValue = processFieldValue(pasteValue, fieldValueType)

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
  }, [selectedCells, gridMap, foldersMap, tasksMap, updateEntities, columnEnums])

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
