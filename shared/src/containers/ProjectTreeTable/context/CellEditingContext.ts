import { createContext, useContext } from 'react'
import { CellId } from '../utils/cellUtils'
import { InheritFromParent, UpdateTableEntities } from '../hooks/useUpdateTableData'
import { UseHistoryReturn } from '../hooks/useHistory'

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

export const CellEditingContext = createContext<CellEditingContextType | undefined>(undefined)

export const useCellEditing = (): CellEditingContextType => {
  const context = useContext(CellEditingContext)
  if (context === undefined) {
    throw new Error('useCellEditing must be used within a CellEditingProvider')
  }
  return context
}
