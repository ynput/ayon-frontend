import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  ReactNode,
} from 'react'
import { CellId } from '../utils/cellUtils'
import useUpdateTableData, {
  InheritFromParent,
  UpdateTableEntities,
} from '../hooks/useUpdateTableData'
import { toast } from 'react-toastify'
import useValidateUpdates from '../utils/validateUpdateEntities'
import useHistory, { UseHistoryReturn } from '../hooks/useHistory'
import validateUpdateEntities from '../utils/validateUpdateEntities'
import { useProjectTableContext } from './ProjectTableContext'

export interface CellEditingContextType {
  editingCellId: CellId | null
  setEditingCellId: (id: CellId | null) => void
  isEditing: (id: CellId) => boolean
  updateEntities: UpdateTableEntities
  inheritFromParent: InheritFromParent
  // Add history functions to context
  history: UseHistoryReturn
  undo: () => Promise<void>
  redo: () => Promise<void>
}

const CellEditingContext = createContext<CellEditingContextType | undefined>(undefined)

export const CellEditingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [editingCellId, setEditingCellId] = useState<CellId | null>(null)

  // Memoize these functions to prevent unnecessary re-renders
  const isEditing = useCallback((id: CellId) => id === editingCellId, [editingCellId])

  // Get history functions
  const history = useHistory()
  const { pushHistory, undo: undoHistory, redo: redoHistory, canUndo, canRedo } = history

  const { updateEntities: updateOverviewEntities, inheritFromParent } = useUpdateTableData({
    pushHistory,
  })
  const { attribFields } = useProjectTableContext()

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

  // Listen for global undo/redo shortcuts and invoke context handlers
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

      const isMac =
        typeof navigator !== 'undefined' &&
        // @ts-expect-error
        ((navigator.userAgentData &&
          // @ts-expect-error
          navigator.userAgentData.platform.toUpperCase().includes('MAC')) ||
          navigator.userAgent.toUpperCase().includes('MAC'))
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      if (ctrlKey && e.key === 'z') {
        e.preventDefault()
        if (canUndo) handleUndo()
      }
      if (
        (ctrlKey && e.key === 'y') ||
        (ctrlKey && e.shiftKey && e.key === 'z') ||
        (ctrlKey && e.key === 'Z')
      ) {
        e.preventDefault()
        if (canRedo) handleRedo()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [canUndo, canRedo, handleUndo, handleRedo])

  return <CellEditingContext.Provider value={value}>{children}</CellEditingContext.Provider>
}

export const useCellEditing = (): CellEditingContextType => {
  const context = useContext(CellEditingContext)
  if (context === undefined) {
    throw new Error('useCellEditing must be used within a CellEditingProvider')
  }
  return context
}
