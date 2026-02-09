import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react'

// Contexts
import { ROW_SELECTION_COLUMN_ID, useSelectionCellsContext } from './SelectionCellsContext'
import { useCellEditing } from './CellEditingContext'
import { useProjectContext } from '@shared/context'

// Utils
import {
  getCellValue,
  getEntityDataById,
  getLinkEntityIdsByColumnId,
  parseCellId,
} from '../utils/cellUtils'

// Types
import { EntityUpdate } from '../hooks/useUpdateTableData'
import usePasteLinks, { LinkUpdate } from '../hooks/usePasteLinks'
import { useUpdateSubtasksMutation } from '@shared/api'

// Import from the new modular files
import {
  getEntityPath,
  parseClipboardText,
  clipboardError,
  processFieldValue,
  subtasksToTSV,
  isSubtasksTSV,
  tsvToSubtasks,
  sanitizeSubtaskName,
} from './clipboard'
import { validateClipboardData } from './clipboard/clipboardValidation'
import { ClipboardContextType, ClipboardProviderProps } from './clipboard/clipboardTypes'
import { useProjectTableContext } from './ProjectTableContext'
import { validateEntityId, getEntityId } from '@shared/util'

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined)

export const ClipboardProvider: React.FC<ClipboardProviderProps> = ({
  children,
  entitiesMap,
  columnEnums,
  columnReadOnly,
  visibleColumns,
}) => {
  // Get selection information from SelectionContext
  const { selectedCells, gridMap, focusedCellId } = useSelectionCellsContext()
  const { updateEntities, history } = useCellEditing()
  const { pasteTableLinks } = usePasteLinks()
  const { getEntityById, attribFields } = useProjectTableContext()
  const { projectName } = useProjectContext()
  const [updateSubtasks] = useUpdateSubtasksMutation()

  const getSelectionData = useCallback(
    async (selected: string[], config?: { headers?: boolean; fullRow?: boolean }) => {
      const { headers, fullRow } = config || {}
      try {
        // Get visible columns in display order, excluding row selection
        const visibleColumnIds = visibleColumns
          .map((col) => col.id)
          .filter((id) => id !== ROW_SELECTION_COLUMN_ID)

        // Organize selected cells by row, filtering to only visible columns
        const cellsByRow = new Map<string, Set<string>>()

        // Parse all selected cells and organize by rowId and colId
        selected.forEach((cellId) => {
          const position = parseCellId(cellId)
          if (!position) return

          const { rowId, colId } = position
          if (colId === ROW_SELECTION_COLUMN_ID || !visibleColumnIds.includes(colId)) return

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
          // Get the entity for this row
          const entity = getEntityById(rowId)

          if (!entity) {
            console.warn(`Entity not found for rowId: ${rowId}`)
            continue
          }

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

            // special handling of link cells
            if (colId.startsWith('link_')) {
              // @ts-expect-error - only complaining about missing __typename
              cellValue = getLinkEntityIdsByColumnId(entity.links, colId)
            } else if (colId === 'subtasks') {
              // Special handling for subtasks - convert to TSV format
              // @ts-ignore
              const subtasks = getCellValue(entity, colId) || []
              cellValue = subtasksToTSV(subtasks, entity.id, entity.name)
            } else {
              // @ts-ignore
              let foundValue = getCellValue(entity, colId)

              if (!foundValue) {
                // we should look for the default value set out in attribFields
                const field = attribFields.find((f) => f.name === colId.replace('attrib_', ''))
                if (field && field.data.type === 'boolean') {
                  foundValue = false // default boolean value
                } else if (field && field.data.type.includes('list_of')) {
                  foundValue = [] // default list value
                }
              }

              // convert to string if foundValue is not undefined or null use empty string otherwise
              cellValue = foundValue !== undefined && foundValue !== null ? String(foundValue) : ''

              // Special handling for name field - include full path
              if (colId === 'name') {
                cellValue = getEntityPath(entity.entityId || entity.id, entitiesMap)
              }

              if (colId === 'subType') {
                // get folderType or taskType
                if ('folderType' in entity) {
                  cellValue = entity.folderType || ''
                }
                if ('taskType' in entity) {
                  cellValue = entity.taskType || ''
                }
              }
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
    [selectedCells, focusedCellId, gridMap, entitiesMap, getEntityById, visibleColumns],
  )

  const doesClipboardContainId = async () => {
    // check if the clipboard contains a valid ID
    const clipboardText = await getClipboardString()
    if (!clipboardText) return false
    const parsedData = parseClipboardText(clipboardText)
    if (parsedData.length === 0) return false
    return parsedData.every((row) => {
      return row.values.every((value) => value.split(',').every((v) => validateEntityId(v)))
    })
  }

  const copyToClipboard: ClipboardContextType['copyToClipboard'] = useCallback(
    async (selected, fullRow) => {
      selected = selected || Array.from(selectedCells)
      if (!selected.length) return
      const clipboardText = await getSelectionData(selected, { fullRow })
      if (!clipboardText) {
        return
      }
      if (!navigator.clipboard) {
        clipboardError('Clipboard API not supported in this browser.')
        return
      }
      if (!window.isSecureContext) {
        clipboardError('Clipboard operations require a secure HTTPS context.')
        return
      }
      try {
        await navigator.clipboard.writeText(clipboardText)
      } catch (error: any) {
        clipboardError(`Failed to copy to clipboard: ${error.message}`)
      }
    },
    [selectedCells, entitiesMap, gridMap],
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
    [selectedCells, entitiesMap, gridMap, getSelectionData],
  )

  const getClipboardString = async (): Promise<string | void> => {
    if (!navigator.clipboard) {
      clipboardError('Clipboard API not supported in this browser.')
      return
    }
    if (!window.isSecureContext) {
      clipboardError('Clipboard operations require a secure HTTPS context.')
      return
    }
    let clipboardText: string
    try {
      clipboardText = await navigator.clipboard.readText()
      return clipboardText
    } catch (error: any) {
      clipboardError(`Failed to read from clipboard: ${error.message}`)
      return
    }
  }

  const pasteFromClipboard: ClipboardContextType['pasteFromClipboard'] = useCallback(
    async (selected, config) => {
      const { method = 'replace' } = config || {}
      if (!selected.length) return

      const clipboardText = await getClipboardString()
      if (!clipboardText) return

      // Check if this is subtasks TSV data first, before normal parsing
      let isSubtasksData = false
      let subtasksClipboardText = clipboardText
      if (isSubtasksTSV(clipboardText)) {
        isSubtasksData = true
      }

      // Parse the clipboard text
      const parsedData = parseClipboardText(clipboardText)
      if (!parsedData.length) return

      // Determine if we have a single value in the clipboard (one row, one column)
      const isSingleCellValue = parsedData.length === 1 && parsedData[0].values.length === 1

      // Get visible columns in display order, excluding row selection
      const visibleColumnIds = visibleColumns
        .map((col) => col.id)
        .filter((id) => id !== ROW_SELECTION_COLUMN_ID)

      // Helper function to map clipboard values to visible columns
      const mapClipboardToVisibleColumns = (
        clipboardRow: any,
        visibleColumnIds: string[],
        clipboardHeaders?: string[],
      ) => {
        const mappedValues: Record<string, string> = {}

        if (clipboardHeaders && clipboardHeaders.length > 0) {
          // Map by header names when available
          clipboardHeaders.forEach((header: string, index: number) => {
            const matchingColId = visibleColumnIds.find(
              (colId) =>
                colId === header ||
                colId.replace('attrib_', '') === header ||
                colId === `attrib_${header}` ||
                colId.toLowerCase() === header.toLowerCase(),
            )

            if (matchingColId && index < clipboardRow.values.length) {
              mappedValues[matchingColId] = clipboardRow.values[index]
            }
          })
        } else {
          // Fallback: map by position, but only to visible columns
          visibleColumnIds.forEach((colId, index) => {
            if (index < clipboardRow.values.length) {
              mappedValues[colId] = clipboardRow.values[index]
            }
          })
        }

        return mappedValues
      }

      // Extract headers if they exist (assuming first row might be headers from external source)
      // You might need to detect this differently based on your clipboard format
      const clipboardHeaders = parsedData[0]?.colIds || undefined

      // Organize selected cells by row, filtering to only visible columns
      const cellsByRow = new Map<string, Set<string>>()

      Array.from(selected).forEach((cellId) => {
        const position = parseCellId(cellId)
        if (!position) return

        const { rowId, colId } = position
        if (colId === ROW_SELECTION_COLUMN_ID || !visibleColumnIds.includes(colId)) return

        if (!cellsByRow.has(rowId)) {
          cellsByRow.set(rowId, new Set())
        }
        cellsByRow.get(rowId)?.add(colId)
      })

      // Get sorted row IDs and column IDs
      const sortedRows = Array.from(cellsByRow.keys()).sort((a, b) => {
        const indexA = gridMap.rowIdToIndex.get(a) ?? Infinity
        const indexB = gridMap.rowIdToIndex.get(b) ?? Infinity
        return indexA - indexB
      })

      const firstRow = sortedRows[0]
      const selectedColIds = Array.from(cellsByRow.get(firstRow) || []).sort((a, b) => {
        const indexA = gridMap.colIdToIndex.get(a) ?? Infinity
        const indexB = gridMap.colIdToIndex.get(b) ?? Infinity
        return indexA - indexB
      })

      // First pass: validate all values
      for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
        const rowId = sortedRows[rowIndex]
        const isFolder = getEntityDataById<'folder'>(rowId, entitiesMap)?.entityType === 'folder'

        const pasteRowIndex = rowIndex % parsedData.length
        const clipboardRow = parsedData[pasteRowIndex]

        // Map clipboard data to visible columns
        const mappedValues = isSingleCellValue
          ? { [selectedColIds[0]]: parsedData[0].values[0] }
          : mapClipboardToVisibleColumns(clipboardRow, selectedColIds, clipboardHeaders)

        // Validate each mapped value
        for (const colId of selectedColIds) {
          const pasteValue = mappedValues[colId] || ''

          const isValid = validateClipboardData({
            colId,
            isFolder,
            pasteValue,
            parsedData,
            columnEnums,
            columnReadOnly,
            rowIndex,
            colIndex: selectedColIds.indexOf(colId),
            isSingleCellValue,
            attribFields,
          })

          if (!isValid) return
        }
      }

      // Create a map to consolidate updates for the same entity
      const entitiesToUpdateMap = new Map<
        string,
        {
          rowId: string
          id: string
          type: string
          fields: Record<string, any>
          attrib: Record<string, any>
          links: Record<string, string[]>
          subtasks?: any[]
          previousSubtasks?: any[]
        }
      >()

      // For each column, prepare updates
      for (let colIndex = 0; colIndex < selectedColIds.length; colIndex++) {
        const colId = selectedColIds[colIndex]

        // Skip special handling for 'name' which we don't want to paste
        if (colId === 'name') continue

        // Special handling for subtasks column
        if (colId === 'subtasks') {
          // For subtasks, group them by source task so each group can be applied to different cells
          let subtaskGroups: Array<{ taskId?: string; taskName?: string; subtasks: any[] }> = []
          let isFromSingleSourceTask = false

          if (isSubtasksData) {
            // Parse all subtask data to understand the source grouping
            const allLines = subtasksClipboardText.trim().split('\n')

            // Check for header
            const firstLine = allLines[0].toLowerCase()
            const hasHeader =
              firstLine.includes('label') &&
              firstLine.includes('name') &&
              firstLine.includes('start date') &&
              firstLine.includes('end date') &&
              firstLine.includes('assignees') &&
              firstLine.includes('status')

            const dataLines = hasHeader ? allLines.slice(1) : allLines

            // Parse all lines and group by source taskId
            const groupMap = new Map<string, any[]>()
            const groupOrder: string[] = []

            dataLines.forEach((line) => {
              const parsed = tsvToSubtasks(line)
              if (parsed.length === 0) return

              const subtask = parsed[0]
              const groupKey = `${subtask.taskId || ''}|${subtask.taskName || ''}`

              if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, [])
                groupOrder.push(groupKey)
              }
              groupMap.get(groupKey)!.push(subtask)
            })

            // Create groups in order
            groupOrder.forEach((groupKey) => {
              const [taskId, taskName] = groupKey.split('|')
              subtaskGroups.push({
                taskId: taskId || undefined,
                taskName: taskName || undefined,
                subtasks: groupMap.get(groupKey) || [],
              })
            })

            // Check if all subtasks come from the same source task
            isFromSingleSourceTask = subtaskGroups.length <= 1
          }

          // Handle subtasks paste for each selected row
          for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
            const rowId = sortedRows[rowIndex]
            const entityType = getEntityDataById(rowId, entitiesMap)?.entityType

            // Subtasks only apply to tasks
            if (entityType !== 'task') continue

            // Get or create entity entry in the map
            const entityKey = `${rowId}-${entityType}`
            if (!entitiesToUpdateMap.has(entityKey)) {
              entitiesToUpdateMap.set(entityKey, {
                rowId,
                id: rowId,
                type: entityType,
                fields: {},
                attrib: {},
                links: {},
              })
            }

            const entityData = entitiesToUpdateMap.get(entityKey)!
            // Get existing subtasks from entity
            const entity = getEntityById(rowId)
            const existingSubtasks = (entity && 'subtasks' in entity && entity.subtasks) || []
            // store previous subtasks for history/undo
            entityData.previousSubtasks = existingSubtasks

            let subtasksToProcess: any[] = []

            if (isSubtasksData) {
              if (isFromSingleSourceTask && subtaskGroups.length > 0) {
                // All subtasks from one source - apply to all cells
                subtasksToProcess = subtaskGroups[0].subtasks
              } else if (subtaskGroups.length > 0) {
                // Multiple groups - distribute by row (like regular data does with modulo)
                const groupIndex = rowIndex % subtaskGroups.length
                subtasksToProcess = subtaskGroups[groupIndex].subtasks
              }
            } else {
              // For parsed clipboard data, get the appropriate row
              if (isSingleCellValue) {
                const pasteValue = parsedData[0].values[0]
                subtasksToProcess = tsvToSubtasks(pasteValue)
              } else {
                const pasteRowIndex = rowIndex % parsedData.length
                const clipboardRow = parsedData[pasteRowIndex]
                const pasteColIndex = colIndex % clipboardRow.values.length
                const pasteValue = clipboardRow.values[pasteColIndex]
                subtasksToProcess = tsvToSubtasks(pasteValue)
              }
            }

            // Skip if no subtasks to process
            if (!subtasksToProcess || subtasksToProcess.length === 0) continue

            // Create normalized subtasks from parsed data
            const newSubtasks = subtasksToProcess.map((st, index) => ({
              id: getEntityId(),
              name: sanitizeSubtaskName(st.name || st.label || `Subtask ${index + 1}`),
              label: st.label || '',
              assignees: st.assignees || [],
              description: st.label || '',
              startDate: st.startDate,
              endDate: st.endDate,
              isDone: st.isDone || false,
            }))

            // Handle merge vs replace
            if (method === 'merge') {
              // Merge new subtasks with existing ones, removing duplicates by label and name
              const mergedSubtasks = [...existingSubtasks]
              const existingIdentifiers = new Set(
                existingSubtasks.map((st) => {
                  const label = (st.label || '').toLowerCase()
                  const name = (st.name || '').toLowerCase()
                  return `${label}|${name}`
                }),
              )

              // Add new subtasks that don't already exist
              for (const newSubtask of newSubtasks) {
                const label = (newSubtask.label || '').toLowerCase()
                const name = (newSubtask.name || '').toLowerCase()
                const identifier = `${label}|${name}`
                if (!existingIdentifiers.has(identifier)) {
                  mergedSubtasks.push(newSubtask)
                }
              }
              entityData.subtasks = mergedSubtasks
            } else {
              // Replace mode: use new subtasks, preserving IDs for any matching label and name
              const replacedSubtasks = newSubtasks.map((newSt) => {
                // Try to find existing subtask with matching label and name to preserve ID
                const existingMatch = existingSubtasks.find(
                  (est) =>
                    (est.label || '').toLowerCase() === (newSt.label || '').toLowerCase() &&
                    (est.name || '').toLowerCase() === (newSt.name || '').toLowerCase(),
                )
                return {
                  ...newSt,
                  id: existingMatch?.id || newSt.id,
                }
              })
              entityData.subtasks = replacedSubtasks
            }
          }
          continue
        }

        // Check if this is an attribute field by examining the first entity
        let isAttrib = false,
          isLink = false
        // Check if the field potentially contains array values
        let fieldValueType: 'string' | 'number' | 'boolean' | 'array' = 'string'

        if (sortedRows.length > 0) {
          const firstRowId = sortedRows[0]
          const entity = getEntityById(firstRowId)
          if (entity) {
            isAttrib = colId.startsWith('attrib_')
            isLink = colId.startsWith('link_')

            // Determine field type based on type or attrib type
            if (colId === 'status' || colId === 'subType') {
              // status and subType are strings
              fieldValueType = 'string'
              // special case to avoid treating subType as attrib (not sure if this is needed)
              isAttrib = false
            } else if (colId === 'tags' || colId === 'assignees') {
              // tags and assignees are always arrays
              fieldValueType = 'array'
            } else if (isAttrib) {
              // find type based on attribFields
              const fieldName = colId.replace('attrib_', '')
              const attribField = attribFields.find((f) => f.name === fieldName)
              if (attribField) {
                const dataType = attribField.data.type
                switch (dataType) {
                  case 'boolean':
                    fieldValueType = 'boolean'
                    break
                  case 'float':
                  case 'integer':
                    fieldValueType = 'number'
                    break
                  case 'list_of_strings':
                  case 'list_of_any':
                  case 'list_of_integers':
                  case 'list_of_submodels':
                    fieldValueType = 'array'
                    break
                  default:
                    // everything else is string
                    fieldValueType = 'string'
                }
              }
            } else if (isLink) {
              // links are always arrays
              fieldValueType = 'array'
            }
          }
        }

        // Process each row individually
        for (let rowIndex = 0; rowIndex < sortedRows.length; rowIndex++) {
          const rowId = sortedRows[rowIndex]
          const entityType = getEntityDataById(rowId, entitiesMap)?.entityType
          const isFolder = entityType === 'folder'

          // Get the appropriate value from the clipboard data
          let pasteValue
          if (isSingleCellValue) {
            pasteValue = parsedData[0].values[0]
          } else {
            const pasteRowIndex = rowIndex % parsedData.length
            // Map visible column index to clipboard data index
            // When clipboard contains hidden columns, we need to skip over values
            // that correspond to hidden columns when pasting to visible columns
            const clipboardRow = parsedData[pasteRowIndex]

            // If clipboard has more values than visible columns being pasted to,
            // it likely contains hidden column data. We need to reconstruct the original
            // column order that was copied by finding which columns would have been included.
            if (clipboardRow.values.length > selectedColIds.length) {
              // The clipboard data was created from consecutive columns in grid order.
              // We need to find which consecutive columns would result in this clipboard data.
              // Start from the first visible column and extend the range to match clipboard length.
              const firstVisibleColIndex = gridMap.colIdToIndex.get(selectedColIds[0]) ?? 0

              // Get all columns sorted by grid position
              const allGridColumns = Array.from(gridMap.colIdToIndex.keys())
                .filter((id) => id !== ROW_SELECTION_COLUMN_ID)
                .sort((a, b) => {
                  const indexA = gridMap.colIdToIndex.get(a) ?? Infinity
                  const indexB = gridMap.colIdToIndex.get(b) ?? Infinity
                  return indexA - indexB
                })

              // Find the starting position in the grid columns array
              const startGridPos = allGridColumns.findIndex(
                (id) => gridMap.colIdToIndex.get(id) === firstVisibleColIndex,
              )

              // The original copied columns are the consecutive ones starting from this position
              const originalCopiedColumns = allGridColumns.slice(
                startGridPos,
                startGridPos + clipboardRow.values.length,
              )

              // Find this column's position in the original copied columns
              const clipboardColIndex = originalCopiedColumns.indexOf(colId)
              pasteValue =
                clipboardRow.values[clipboardColIndex] ||
                clipboardRow.values[clipboardColIndex % clipboardRow.values.length]
              // Pasting value from hidden columns detection
            } else {
              // Normal case: map clipboard column index using modulo
              const pasteColIndex = colIndex % clipboardRow.values.length
              pasteValue = clipboardRow.values[pasteColIndex]
              // Pasting value normally
            }
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
          if (!entitiesToUpdateMap.has(entityKey) && entityType) {
            entitiesToUpdateMap.set(entityKey, {
              rowId,
              id: rowId,
              type: entityType,
              fields: {},
              attrib: {},
              links: {},
            })
          }

          const entityData = entitiesToUpdateMap.get(entityKey)!

          // Add the field to the appropriate place
          if (isLink) {
            const [_link, linkType, inType, outType, direction] = colId.split('_')
            // final-task|folder|task
            entityData.links[`${linkType}|${inType}|${outType}_${direction}`] = processedValue
          } else if (isAttrib) {
            entityData.attrib[fieldToUpdate] = processedValue
          } else {
            entityData.fields[fieldToUpdate] = processedValue
          }
        }
      }

      // Convert the consolidated map to EntityUpdate array and LinkUpdate array
      const allEntityUpdates: EntityUpdate[] = []
      const linkUpdatesMap = new Map<string, LinkUpdate>()

      entitiesToUpdateMap.forEach((entity) => {
        // For regular fields, create one update per field
        Object.entries(entity.fields).forEach(([field, value]) => {
          allEntityUpdates.push({
            rowId: entity.rowId,
            id: entity.id,
            type: entity.type,
            field,
            value,
          })
        })

        // For attributes, create one update per attribute
        Object.entries(entity.attrib).forEach(([field, value]) => {
          allEntityUpdates.push({
            rowId: entity.rowId,
            id: entity.id,
            type: entity.type,
            field,
            value,
            isAttrib: true,
          })
        })

        // For links, create LinkUpdate objects
        Object.entries(entity.links).forEach(([linkKey, targetEntityIds]) => {
          // Parse the linkKey: "linkType|inType|outType_direction"
          const [linkTypePart, direction] = linkKey.split('_')
          const linkTypeParts = linkTypePart.split('|')

          if (linkTypeParts.length >= 3) {
            const linkTypeName = linkTypeParts[0]
            const inType = linkTypeParts[1]
            const outType = linkTypeParts[2]

            // Reconstruct the full linkType in the required format: name|input_type|output_type
            const linkType = `${linkTypeName}|${inType}|${outType}`

            // Determine target entity type based on direction
            const targetEntityType = direction === 'out' ? outType : inType

            // Create a unique key for this link operation
            const linkUpdateKey = `${entity.id}-${linkType}-${direction}`

            linkUpdatesMap.set(linkUpdateKey, {
              rowId: entity.rowId,
              sourceEntityId: entity.id,
              sourceEntityType: entity.type,
              linkType,
              direction: direction as 'in' | 'out',
              targetEntityType,
              operation: method,
              targetEntityIds: Array.isArray(targetEntityIds) ? targetEntityIds : [],
            })
          }
        })
      })

      const allLinkUpdates = Array.from(linkUpdatesMap.values())

      // Collect subtasks updates
      const subtasksUpdates: Array<{ taskId: string; subtasks: any[]; previousSubtasks?: any[] }> =
        []
      entitiesToUpdateMap.forEach((entity) => {
        if (entity.subtasks) {
          subtasksUpdates.push({
            taskId: entity.id,
            subtasks: entity.subtasks,
            previousSubtasks: entity.previousSubtasks,
          })
        }
      })

      // Make separate calls to update entities, links, and subtasks
      const updatePromises: Promise<void>[] = []

      if (allEntityUpdates.length > 0) {
        updatePromises.push(updateEntities(allEntityUpdates))
      }

      if (allLinkUpdates.length > 0) {
        updatePromises.push(pasteTableLinks(allLinkUpdates))
      }

      if (subtasksUpdates.length > 0) {
        // push undo/redo history entries for subtasks updates
        if (history) {
          subtasksUpdates.forEach(({ taskId, subtasks, previousSubtasks }) => {
            const prev = previousSubtasks || []
            const next = subtasks || []
            const undoCallback = () => {
              updateSubtasks({ projectName, taskId, subtasks: prev })
                .unwrap()
                .catch(() => {})
            }
            const redoCallback = () => {
              updateSubtasks({ projectName, taskId, subtasks: next })
                .unwrap()
                .catch(() => {})
            }
            history.pushHistory([undoCallback], [redoCallback])
          })
        }
        // Update subtasks for each task
        const subtasksPromises = subtasksUpdates.map(({ taskId, subtasks }) =>
          updateSubtasks({ projectName, taskId, subtasks }).unwrap(),
        )
        updatePromises.push(...subtasksPromises)
      }

      if (updatePromises.length > 0) {
        try {
          await Promise.all(updatePromises)
        } catch (error: any) {
          console.error('Error updating entities:', error)
          clipboardError(`Paste failed: ${error || error?.message || 'Unknown error'}`)
        }
      }
    },
    [
      selectedCells,
      gridMap,
      entitiesMap,
      updateEntities,
      pasteTableLinks,
      columnEnums,
      getEntityById,
      visibleColumns,
      attribFields,
      projectName,
      updateSubtasks,
      history,
    ],
  )

  // Set up keyboard event listeners
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Copy functionality (Ctrl+C or Command+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const activeEl = document.activeElement as HTMLElement | null

        const isTableFocused =
          activeEl?.closest('table') !== null ||
          activeEl?.closest('.table-container') !== null ||
          activeEl?.tagName === 'TD' ||
          activeEl?.tagName === 'TH'

        // Check if there's a text selection in an input/textarea/contenteditable
        const isEditableElement =
          activeEl?.tagName === 'INPUT' ||
          activeEl?.tagName === 'TEXTAREA' ||
          activeEl?.isContentEditable

        const hasTextSelection = window.getSelection()?.toString().length ?? 0 > 0

        //  If user has text selected elsewhere, let browser copy that
        if (hasTextSelection && !isTableFocused) {
          return // Let browser handle
        }

        // If focus is in an editable element, let browser handle
        if (isEditableElement && !isTableFocused) {
          return // Let browser handle
        }
        // If cells are selected, copy table data (even if focus moved away)
        if (selectedCells.size > 0) {
          await copyToClipboard()
        } else {
          //  No cells selected, allowing default browser copy
        }
      }
      // Paste functionality (Ctrl+V or Command+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // don't execute paste if focus is inside an input, textarea, or content‐editable element
        const activeEl = document.activeElement as HTMLElement | null

        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.isContentEditable)
        ) {
          // focus is inside an input, textarea, or content-editable element
          const allEntityIds = await doesClipboardContainId()
          // we might still want to paste if the clipboard contains valid entity IDs
          if (allEntityIds) {
            // prevent pasting into input fields and handle as paste on the cell
            e.preventDefault()
          } else {
            // skip pasting
            return
          }
        }
        pasteFromClipboard(Array.from(selectedCells), {
          method: e.shiftKey ? 'merge' : 'replace', // Use shift key to determine paste method
        })
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
