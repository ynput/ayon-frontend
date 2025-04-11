import React, { createContext, useContext, ReactNode, useMemo } from 'react'
import {
  ColumnOrderState,
  ColumnPinningState,
  functionalUpdate,
  OnChangeFn,
  VisibilityState,
} from '@tanstack/react-table'
import { useLocalStorage } from '../../hooks'

export interface ColumnSettingsContextType {
  // Column Visibility
  columnVisibility: VisibilityState
  setColumnVisibility: (columnVisibility: VisibilityState) => void
  updateColumnVisibility: (columnVisibility: VisibilityState) => void
  columnVisibilityUpdater: OnChangeFn<VisibilityState>

  // Column Pinning
  columnPinning: ColumnPinningState
  setColumnPinning: (columnPinning: ColumnPinningState) => void
  updateColumnPinning: (columnPinning: ColumnPinningState) => void
  columnPinningUpdater: OnChangeFn<ColumnPinningState>

  // Column Order
  columnOrder: ColumnOrderState
  setColumnOrder: (columnOrder: ColumnOrderState) => void
  updateColumnOrder: (columnOrder: ColumnOrderState) => void
  columnOrderUpdater: OnChangeFn<ColumnOrderState>
}

const ColumnSettingsContext = createContext<ColumnSettingsContextType | undefined>(undefined)

interface ColumnSettingsProviderProps {
  children: ReactNode
  projectName: string
}

export const ColumnSettingsProvider: React.FC<ColumnSettingsProviderProps> = ({
  children,
  projectName,
}) => {
  const scope = `overview-${projectName}`

  // COLUMN VISIBILITY
  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
    `overview-column-visibility-${scope}`,
    {},
  )

  // COLUMN ORDER
  const [columnOrder, setColumnOrder] = useLocalStorage<ColumnOrderState>(
    `column-order-${scope}`,
    [],
  )

  // COLUMN PINNING
  const [columnPinning, setColumnPinning] = useLocalStorage<ColumnPinningState>(
    `column-pinning-${scope}`,
    { left: ['name'] },
  )

  const togglePinningOnVisibilityChange = (visibility: VisibilityState) => {
    // ensure that any columns that are now hidden are removed from the pinning
    const newPinning = { ...columnPinning }
    const pinnedColumns = newPinning.left || []
    const hiddenColumns = Object.keys(visibility).filter((col) => visibility[col] === false)
    const newPinnedColumns = pinnedColumns.filter((col) => !hiddenColumns.includes(col))
    const newColumnPinning = {
      ...newPinning,
      left: newPinnedColumns,
    }
    setColumnPinning(newColumnPinning)
  }

  // COLUMN VISIBILITY
  const columnVisibilityUpdater: OnChangeFn<VisibilityState> = (columnVisibilityUpdater) => {
    setColumnVisibility(functionalUpdate(columnVisibilityUpdater, columnVisibility))
    // side effects
    togglePinningOnVisibilityChange(columnVisibility)
  }

  // update the column visibility
  const updateColumnVisibility = (visibility: VisibilityState) => {
    setColumnVisibility(visibility)
    // side effects
    togglePinningOnVisibilityChange(visibility)
  }

  const updatePinningOrderOnOrderChange = (columnOrder: ColumnOrderState) => {
    // ensure that the column pinning is in the order of the column order
    const newPinning = { ...columnPinning }
    const pinnedColumns = newPinning.left || []
    const pinnedColumnsOrder = columnOrder.filter((col) => pinnedColumns.includes(col))
    setColumnPinning({
      ...newPinning,
      left: pinnedColumnsOrder,
    })
  }

  const columnOrderUpdater: OnChangeFn<ColumnOrderState> = (columnOrderUpdater) => {
    setColumnOrder(functionalUpdate(columnOrderUpdater, columnOrder))
    // now update the column pinning
    updatePinningOrderOnOrderChange(columnOrder)
  }

  const updateColumnOrder = (columnOrder: ColumnOrderState) => {
    setColumnOrder(columnOrder)
    // now update the column pinning
    updatePinningOrderOnOrderChange(columnOrder)
  }

  // COLUMN PINNING
  const updateOrderOnPinningChange = (columnPinning: ColumnPinningState) => {
    // we resort the column order based on the pinning
    const newOrder = [...columnOrder].sort((a, b) => {
      const aPinned = columnPinning.left?.includes(a) ? 1 : 0
      const bPinned = columnPinning.left?.includes(b) ? 1 : 0

      return bPinned - aPinned
    })
    setColumnOrder(newOrder)
  }

  const updateColumnPinning = (columnPinning: ColumnPinningState) => {
    setColumnPinning(columnPinning)
    // now update the column order
    updateOrderOnPinningChange(columnPinning)
  }

  const columnPinningUpdater: OnChangeFn<ColumnPinningState> = (columnPinningUpdater) => {
    const newPinning = functionalUpdate(columnPinningUpdater, columnPinning)
    setColumnPinning(newPinning)
    // now update the column order
    updateOrderOnPinningChange(newPinning)
  }

  return (
    <ColumnSettingsContext.Provider
      value={{
        // column visibility
        columnVisibility,
        setColumnVisibility,
        updateColumnVisibility,
        columnVisibilityUpdater,
        // column pinning
        columnPinning,
        setColumnPinning,
        updateColumnPinning,
        columnPinningUpdater,
        // column order
        columnOrder,
        setColumnOrder,
        updateColumnOrder,
        columnOrderUpdater,
      }}
    >
      {children}
    </ColumnSettingsContext.Provider>
  )
}

export const useColumnSettings = (): ColumnSettingsContextType => {
  const context = useContext(ColumnSettingsContext)
  if (!context) {
    throw new Error('useColumnSettings must be used within a ColumnSettingsProvider')
  }
  return context
}
