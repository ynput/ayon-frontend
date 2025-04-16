import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react'

// Contexts
import { ROW_SELECTION_COLUMN_ID, useSelectionContext } from './SelectionContext'
import { useCellEditing } from './CellEditingContext'

// Utils
import { getCellValue, parseCellId } from '../utils/cellUtils'

// Types
import { EntityUpdate } from '../hooks/useUpdateOverview'

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
  columnReadOnly,
}) => {
  // Get selection information from SelectionContext
  const { selectedCells, gridMap, focusedCellId } = useSelectionContext()
  const { updateEntities } = useCellEditing()

  const getSelectionData = useCallback(
    async (selected: string[], config?: { headers?: boolean; fullRow?: boolean }) => {
      const { headers, fullRow } = config || {}
      try {
        // First, organize selected cells by row
        const cellsByRow = new Map<string, Set<string>>()

        // Parse all selected cells and organize by rowId and colId
        selected.forEach((cellId) => {
          const position = parseCellId(cellId)
          if (!position) return

          const { rowId, colId } = position

          // do not include row selection column
          if (colId === ROW_SELECTION_COLUMN_ID) return

          if (!cellsByRow.has(rowId)) {
            cellsByRow.set(rowId, new Set())
          }

          cellsByRow.get(rowId)?.add(colId)
        })

        if (fullRow) {
          const selectedRows = selected
            .filter(
              (cellId) =>
                parseCellId(cellId)?.rowId &&
                parseCellId(cellId)?.colId === ROW_SELECTION_COLUMN_ID,
            )
            .map((cellId) => parseCellId(cellId)?.rowId) as string[]

          // select the whole row
          // For rows with selection cells, add all available columns
          selectedRows.forEach((rowId) => {
            // add the rowId if it doesn't exist
            if (!cellsByRow.has(rowId)) {
              cellsByRow.set(rowId, new Set())
            }
            const allColumns = Array.from(gridMap.colIdToIndex.keys())
            allColumns.forEach((colId) => {
              cellsByRow.get(rowId)?.add(colId)
            })
          })
        }

        // Get sorted row IDs based on their index in the grid
        const sortedRows = Array.from(cellsByRow.keys()).sort((a, b) => {
          const indexA = gridMap.rowIdToIndex.get(a) ?? Infinity
          const indexB = gridMap.rowIdToIndex.get(b) ?? Infinity
          return indexA - indexB
        })

        // Build clipboard text
        let clipboardText = ''

        // Get the first row to determine columns
        const firstRowId = sortedRows[0]
        if (!firstRowId) return ''

        // Get all column IDs for the first row, sorted by their index in the grid
        const colIds = Array.from(cellsByRow.get(firstRowId) || []).sort((a, b) => {
          const indexA = gridMap.colIdToIndex.get(a) ?? Infinity
          const indexB = gridMap.colIdToIndex.get(b) ?? Infinity
          return indexA - indexB
        })

        // Include headers if requested
        if (headers && colIds.length > 0) {
          const headerValues: string[] = []

          for (const colId of colIds) {
            // Use colId as the column name since we don't have direct access to column names
            const columnName = colId
            headerValues.push(`${columnName.replace(/"/g, '""')}`)
          }

          clipboardText += headerValues.join('\t') + '\n'
        }

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

          // Filter out the row selection column from the copied data
          const filteredColIds = colIds.filter((colId) => colId !== ROW_SELECTION_COLUMN_ID)

          const rowValues: string[] = []

          // For each column in this row
          for (const colId of filteredColIds) {
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

        return clipboardText
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    },
    [selectedCells, focusedCellId, gridMap, foldersMap, tasksMap],
  )

  const copyToClipboard: ClipboardContextType['copyToClipboard'] = useCallback(
    async (selected, fullRow) => {
      selected = selected || Array.from(selectedCells)
      if (!selected.length) return

      try {
        // Get clipboard text
        const clipboardText = await getSelectionData(selected, { fullRow })
        if (!clipboardText) return

        // Write to clipboard using the Clipboard API
        await navigator.clipboard.writeText(clipboardText)
        console.log('Copied to clipboard successfully', clipboardText)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    },
    [selectedCells, foldersMap, tasksMap, gridMap],
  )

  const exportCSV: ClipboardContextType['exportCSV'] = useCallback(
    async (selected, projectName, fullRow) => {
      selected = selected || Array.from(selectedCells)
      if (!selected.length) return

      try {
        // Get clipboard text with headers included for CSV export
        const clipboardText = await getSelectionData(selected, { headers: true, fullRow })
        if (!clipboardText) return

        // create a csv file and download it
        const blob = new Blob([clipboardText], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const selectedCount = selected.length
        a.download = `${projectName}-export-${selectedCount}_cells-${new Date()
          .toISOString()
          .slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    },
    [selectedCells, foldersMap, tasksMap, gridMap, getSelectionData],
  )

  const pasteFromClipboard: ClipboardContextType['pasteFromClipboard'] = useCallback(
    async (selected) => {
      selected = selected || Array.from(selectedCells)
      if (!selected.length) return

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
        Array.from(selected).forEach((cellId) => {
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
            const isValid = validateClipboardData({
              colId,
              isFolder,
              pasteValue,
              parsedData,
              columnEnums,
              columnReadOnly,
              rowIndex,
              colIndex,
              isSingleCellValue,
            })

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
    },
    [selectedCells, gridMap, foldersMap, tasksMap, updateEntities, columnEnums],
  )

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
      exportCSV,
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
