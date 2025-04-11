import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { CellId } from '../utils/cellUtils'
import useUpdateOverview, {
  InheritFromParent,
  UpdateTableEntities,
} from '../hooks/useUpdateOverview'

interface CellEditingContextType {
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

  const value = useMemo(
    () => ({
      editingCellId,
      setEditingCellId,
      isEditing,
      updateEntities,
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
