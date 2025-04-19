import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { CellId } from '../utils/cellUtils'
import useUpdateOverview, {
  InheritFromParent,
  UpdateTableEntities,
} from '../hooks/useUpdateOverview'
import { useProjectTableContext } from './ProjectTableContext'
import { AttributeData } from '../types'
import { toast } from 'react-toastify'
import useValidateUpdates from '../hooks/useValidateUpdates'

export interface CellEditingContextType {
  editingCellId: CellId | null
  setEditingCellId: (id: CellId | null) => void
  isEditing: (id: CellId) => boolean
  updateEntities: UpdateTableEntities
  inheritFromParent: InheritFromParent
}

const CellEditingContext = createContext<CellEditingContextType | undefined>(undefined)

export const CellEditingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [editingCellId, setEditingCellId] = useState<CellId | null>(null)

  // Memoize these functions to prevent unnecessary re-renders
  const isEditing = useCallback((id: CellId) => id === editingCellId, [editingCellId])

  const { updateEntities, inheritFromParent } = useUpdateOverview()

  const validateUpdateEntities = useValidateUpdates()

  const handleUpdateEntities: UpdateTableEntities = async (entities = []) => {
    try {
      // validate the entities before updating
      validateUpdateEntities(entities)

      // if validation passes, update the entities
      return await updateEntities(entities)
    } catch (error: any) {
      // if validation fails, show a toast and return
      toast.error(error.message)

      return Promise.reject(error)
    }
  }

  const value = useMemo(
    () => ({
      editingCellId,
      setEditingCellId,
      isEditing,
      updateEntities: handleUpdateEntities,
      inheritFromParent,
    }),
    [editingCellId, isEditing, updateEntities],
  )

  return <CellEditingContext.Provider value={value}>{children}</CellEditingContext.Provider>
}

export const useCellEditing = (): CellEditingContextType => {
  const context = useContext(CellEditingContext)
  if (context === undefined) {
    throw new Error('useCellEditing must be used within a CellEditingProvider')
  }
  return context
}
