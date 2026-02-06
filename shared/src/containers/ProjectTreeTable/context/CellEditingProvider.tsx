import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { CellId, getTypeDefaultValue, parseCellId } from '../utils'
import useHistory from '../hooks/useHistory'
import { useSelectionCellsContext } from './SelectionCellsContext'
import useUpdateTableData, {
  EntityUpdate,
  InheritFromParentEntity,
  UpdateTableEntities,
} from '../hooks/useUpdateTableData'
import { useProjectTableContext } from './ProjectTableContext'
import validateUpdateEntities from '../utils/validateUpdateEntities'
import { toast } from 'react-toastify'
import { CellEditingContext } from './CellEditingContext'

export const CellEditingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [editingCellId, setEditingCellId] = useState<CellId | null>(null)

  // Memoize these functions to prevent unnecessary re-renders
  const isEditing = useCallback((id: CellId) => id === editingCellId, [editingCellId])

  // Get history functions
  const history = useHistory()
  const {
    pushHistory,
    undo: undoHistory,
    redo: redoHistory,
    canUndo,
    canRedo,
    removeHistoryEntries,
  } = history

  const { selectedCells } = useSelectionCellsContext()
  const { updateEntities: updateOverviewEntities, inheritFromParent } = useUpdateTableData({
    pushHistory,
    removeHistoryEntries,
  })
  const { attribFields, getEntityById } = useProjectTableContext()

  const handleUpdateEntities: UpdateTableEntities = useCallback(
    async (entities = [], pushToHistory = true) => {
      try {
        // validate the entities before updating
        validateUpdateEntities(entities, attribFields)

        // if validation passes, update the entities
        return await updateOverviewEntities(entities, pushToHistory)
      } catch (error: any) {
        // if validation fails, show a toast and return
        toast.error(error.message)

        return Promise.reject(error)
      }
    },
    [updateOverviewEntities, attribFields],
  )

  // Handle undo
  const handleUndo = async () => {
    const [entitiesToUndo, entitiesToInherit, callbacks] = undoHistory() || []

    if (entitiesToUndo && entitiesToUndo.length > 0) {
      try {
        await handleUpdateEntities(entitiesToUndo, false)
      } catch (error) {
        toast.error('Failed to undo changes')
      }
    }
    if (entitiesToInherit && entitiesToInherit.length > 0) {
      try {
        await inheritFromParent(entitiesToInherit, false)
      } catch (error) {
        toast.error('Failed to inherit changes')
      }
    }
    // Execute custom callbacks if any
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach((callback) => {
        try {
          callback()
        } catch (error) {
          toast.error('Failed to execute custom undo action')
        }
      })
    }
  }

  // Handle redo
  const handleRedo = async () => {
    const [entitiesToRedo, entitiesToInherit, callbacks] = redoHistory() || []

    if (entitiesToRedo && entitiesToRedo.length > 0) {
      try {
        await handleUpdateEntities(entitiesToRedo, false)
      } catch (error) {
        toast.error('Failed to redo changes')
      }
    }
    if (entitiesToInherit && entitiesToInherit.length > 0) {
      try {
        await inheritFromParent(entitiesToInherit, false)
      } catch (error) {
        toast.error('Failed to inherit changes')
      }
    }
    // Execute custom callbacks if any
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach((callback) => {
        try {
          callback()
        } catch (error) {
          toast.error('Failed to execute custom redo action')
        }
      })
    }
  }

  // Handle clearing cells
  const handleClear = useCallback(
    async (cells: CellId[]) => {
      // we explicity update the value of the cells to their default values
      const entityUpdates: EntityUpdate[] = []
      // of if they are inheritable, we inherit from the parent entity
      const entityInheriting: InheritFromParentEntity[] = []

      for (const cellId of cells) {
        const { colId, rowId } = parseCellId(cellId) || {}
        if (!colId || !rowId) {
          console.warn(`Invalid cellId: ${cellId}`)
          continue
        }

        // get the entity from the rowId
        const entity = getEntityById(rowId)

        if (!entity) return

        // get the field name and check if it is an attribute
        const fieldName = colId.replace('attrib_', '')
        const isAttrib = colId.startsWith('attrib_')

        if (!fieldName) {
          console.warn(`Invalid column ID: ${colId}`)
          continue
        }

        let defaultValue: any = null
        if (isAttrib) {
          // find default value for the attribute
          const attribField = attribFields.find((f) => f.name === fieldName)
          if (!attribField) {
            console.warn(`Attribute field not found: ${fieldName}`)
            continue
          }
          // check if the attribute is inheritable
          if (attribField.data.inherit) {
            // inherit from parent entity
            // check if this entity has already been added to the inheriting list
            const existingInherit = entityInheriting.find((e) => e.entityId === entity.entityId)
            if (existingInherit) {
              // add the attrib to the existing entity
              existingInherit.attribs.push(fieldName)
            } else {
              // add a new entity to the inheriting list
              entityInheriting.push({
                entityId: entity.entityId,
                attribs: [fieldName],
                entityType: entity.entityType,
                ownAttrib: entity.ownAttrib || [],
                rowId: rowId,
                folderId:
                  entity.entityType === 'folder'
                    ? entity.parentId
                    : entity.entityType === 'task'
                    ? entity.folderId
                    : undefined,
              })
            }
            continue
          } else {
            // set explicit default value
            defaultValue = attribField.data.default || getTypeDefaultValue(attribField.data.type)
          }
        } else if (fieldName === 'assignees') {
          // for assignees, we set it to an empty array
          defaultValue = getTypeDefaultValue('list_of_strings')
        } else if (fieldName === 'tags') {
          // for tags, we set it to an empty array
          defaultValue = getTypeDefaultValue('list_of_strings')
        } else {
          // we ignore other fields
          console.warn(`Field not editable: ${fieldName}`)
          continue
        }

        // create the entity update
        const update: EntityUpdate = {
          id: rowId,
          rowId: rowId,
          field: fieldName,
          value: defaultValue,
          isAttrib,
          type: entity.entityType,
        }

        entityUpdates.push(update)
      }

      // if we have updates, call the updateEntities function
      if (entityUpdates.length > 0) {
        try {
          await handleUpdateEntities(entityUpdates, true)
        } catch (error) {
          toast.error('Failed to clear selected cells')
          console.error('Error clearing selected cells:', error)
        }
      }

      // if we have inheritable attributes, call inheritFromParent
      if (entityInheriting.length > 0) {
        try {
          await inheritFromParent(entityInheriting, true)
        } catch (error) {
          toast.error('Failed to inherit parent values for cleared cells')
          console.error('Error clearing inherited cells:', error)
        }
      }

      // if nothing was done, warn the user
      if (entityUpdates.length === 0 && entityInheriting.length === 0) {
        toast.warn('No valid cells selected to clear')
      }
    },
    [attribFields, updateOverviewEntities],
  )

  const value = useMemo(
    () => ({
      editingCellId,
      setEditingCellId,
      isEditing,
      updateEntities: handleUpdateEntities,
      inheritFromParent,
      undo: handleUndo,
      redo: handleRedo,
      history,
    }),
    [
      editingCellId,
      isEditing,
      handleUpdateEntities,
      inheritFromParent,
      handleUndo,
      handleRedo,
      history,
    ],
  )

  // Listen for shortcuts
  // undo - ctrl + z
  // redo - ctrl + y or ctrl + shift + z
  // clear - backspace or delete
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox' ||
        target.tagName === 'LI'
      ) {
        return
      }

      // check focus is on table or body
      const isTableFocused = target?.closest('table') !== null || target === document.body

      if (!isTableFocused) return

      const isMac =
        typeof navigator !== 'undefined' &&
        // @ts-expect-error
        ((navigator.userAgentData &&
          // @ts-expect-error
          navigator.userAgentData.platform.toUpperCase().includes('MAC')) ||
          navigator.userAgent.toUpperCase().includes('MAC'))
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      // undo
      if (ctrlKey && e.key === 'z') {
        e.preventDefault()
        if (canUndo) handleUndo()
      }
      // redo
      if (
        (ctrlKey && e.key === 'y') ||
        (ctrlKey && e.shiftKey && e.key === 'z') ||
        (ctrlKey && e.key === 'Z')
      ) {
        e.preventDefault()
        if (canRedo) handleRedo()
      }
      // clear
      if ((e.key === 'Backspace' && !(e.ctrlKey || e.metaKey)) || e.key === 'Delete') {
        // check we have cells selected
        if (!selectedCells.size) return
        e.preventDefault()

        // find selected cells elements
        const selectedCellElements = Array.from(selectedCells).map((cellId) =>
          document.getElementById(cellId),
        )

        // check the cell is editable from the classnames
        const isEditable = (cell: HTMLElement | null) => cell?.classList.contains('editable')

        // filter out non-editable cells
        const editableCells = selectedCellElements.filter(isEditable)
        if (editableCells.length === 0) {
          toast.warn('No editable cells selected to clear')
          return
        }
        // clear the selected cells
        handleClear(editableCells.map((cell) => cell?.id).filter(Boolean) as CellId[])
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [canUndo, canRedo, handleUndo, handleRedo, selectedCells, handleClear])

  return <CellEditingContext.Provider value={value}>{children}</CellEditingContext.Provider>
}
