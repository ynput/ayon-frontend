import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

interface CellEditingContextType {
  editingCellId: string | null
  setEditingCellId: (id: string | null) => void
  isEditing: (id: string) => boolean
}

const CellEditingContext = createContext<CellEditingContextType | undefined>(undefined)

export const CellEditingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [editingCellId, setEditingCellId] = useState<string | null>(null)

  // Memoize these functions to prevent unnecessary re-renders
  const isEditing = useCallback((id: string) => id === editingCellId, [editingCellId])

  const value = useMemo(
    () => ({
      editingCellId,
      setEditingCellId,
      isEditing,
    }),
    [editingCellId, isEditing],
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
