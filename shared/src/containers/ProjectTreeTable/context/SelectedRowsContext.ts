import { createContext, useContext } from 'react'

export interface SelectedRowsContextType {
  selectedRows: string[]
  isRowSelected: (rowId: string) => boolean
  clearRowsSelection: () => void
  selectAllRows: () => void
  areAllRowsSelected: () => boolean
  areSomeRowsSelected: () => boolean
}

export const SelectedRowsContext = createContext<SelectedRowsContextType | undefined>(undefined)

export const useSelectedRowsContext = () => {
  const context = useContext(SelectedRowsContext)
  if (!context) {
    throw new Error('useSelectedRowsContext must be used within a SelectedRowsProvider')
  }
  return context
}
