import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react'
import {
  ColumnOrderState,
  ColumnPinningState,
  functionalUpdate,
  OnChangeFn,
  VisibilityState,
  ColumnSizingState,
} from '@tanstack/react-table'

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

  // Column Sizing
  columnSizing: ColumnSizingState
  setColumnSizing: (columnSizing: ColumnSizingState) => void
  columnSizingUpdater: OnChangeFn<ColumnSizingState>

  // Global change
  setColumnsConfig: (config: ColumnsConfig) => void
}

const ColumnSettingsContext = createContext<ColumnSettingsContextType | undefined>(undefined)

export type ColumnsConfig = {
  columnVisibility: VisibilityState
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState // Add this
}

interface ColumnSettingsProviderProps {
  children: ReactNode
  config: Record<string, any>
  onChange: (config: ColumnsConfig) => void
}

export const ColumnSettingsProvider: React.FC<ColumnSettingsProviderProps> = ({
  children,
  config,
  onChange,
}) => {
  const columnsConfig = config as ColumnsConfig
  const {
    columnOrder = [],
    columnPinning = {},
    columnVisibility = {},
    columnSizing = {},
  } = columnsConfig

  // DIRECT STATE UPDATES - no side effects
  const setColumnVisibility = (visibility: VisibilityState) => {
    onChange({
      ...columnsConfig,
      columnVisibility: visibility,
    })
  }

  const setColumnOrder = (order: ColumnOrderState) => {
    onChange({
      ...columnsConfig,
      columnOrder: order,
    })
  }

  const setColumnPinning = (pinning: ColumnPinningState) => {
    onChange({
      ...columnsConfig,
      columnPinning: pinning,
    })
  }

  // Column Sizing - this is a bit different as we want to debounce the network request
  // Internal state for column sizing to prevent excessive network requests
  const [internalColumnSizing, setInternalColumnSizing] = useState<ColumnSizingState>(columnSizing)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update internal state sizing when source changes
  useEffect(() => {
    setInternalColumnSizing(columnSizing)
  }, [columnSizing])

  const setColumnSizing = (sizing: ColumnSizingState) => {
    // Update internal state immediately
    setInternalColumnSizing(sizing)

    // Clear any existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }

    // Set a new timeout to debounce the network request
    resizeTimeoutRef.current = setTimeout(() => {
      onChange({
        ...columnsConfig,
        columnSizing: sizing,
      })
    }, 300) // 300ms debounce
  }

  // SIDE EFFECT UTILITIES
  const togglePinningOnVisibilityChange = (visibility: VisibilityState) => {
    // ensure that any columns that are now hidden are removed from the pinning
    const newPinning = { ...columnPinning }
    const pinnedColumns = newPinning.left || []
    const hiddenColumns = Object.keys(visibility).filter((col) => visibility[col] === false)
    const newPinnedColumns = pinnedColumns.filter((col) => !hiddenColumns.includes(col))

    return {
      ...newPinning,
      left: newPinnedColumns,
    }
  }

  const updatePinningOrderOnOrderChange = (order: ColumnOrderState) => {
    // ensure that the column pinning is in the order of the column order
    const newPinning = { ...columnPinning }
    const pinnedColumns = newPinning.left || []
    const pinnedColumnsOrder = order.filter((col) => pinnedColumns.includes(col))

    return {
      ...newPinning,
      left: pinnedColumnsOrder,
    }
  }

  const updateOrderOnPinningChange = (pinning: ColumnPinningState) => {
    // we resort the column order based on the pinning
    return [...columnOrder].sort((a, b) => {
      const aPinned = pinning.left?.includes(a) ? 1 : 0
      const bPinned = pinning.left?.includes(b) ? 1 : 0
      return bPinned - aPinned
    })
  }

  // UPDATE METHODS WITH SIDE EFFECTS
  const updateColumnVisibility = (visibility: VisibilityState) => {
    const newPinning = togglePinningOnVisibilityChange(visibility)
    onChange({
      ...columnsConfig,
      columnVisibility: visibility,
      columnPinning: newPinning,
    })
  }

  const updateColumnOrder = (order: ColumnOrderState) => {
    const newPinning = updatePinningOrderOnOrderChange(order)
    onChange({
      ...columnsConfig,
      columnOrder: order,
      columnPinning: newPinning,
    })
  }

  const updateColumnPinning = (pinning: ColumnPinningState) => {
    const newOrder = updateOrderOnPinningChange(pinning)
    onChange({
      ...columnsConfig,
      columnOrder: newOrder,
      columnPinning: pinning,
    })
  }

  // UPDATER FUNCTIONS
  const columnVisibilityUpdater: OnChangeFn<VisibilityState> = (columnVisibilityUpdater) => {
    const newVisibility = functionalUpdate(columnVisibilityUpdater, columnVisibility)
    updateColumnVisibility(newVisibility)
  }

  const columnOrderUpdater: OnChangeFn<ColumnOrderState> = (columnOrderUpdater) => {
    const newOrder = functionalUpdate(columnOrderUpdater, columnOrder)
    updateColumnOrder(newOrder)
  }

  const columnPinningUpdater: OnChangeFn<ColumnPinningState> = (columnPinningUpdater) => {
    const newPinning = functionalUpdate(columnPinningUpdater, columnPinning)
    updateColumnPinning(newPinning)
  }

  const columnSizingUpdater: OnChangeFn<ColumnSizingState> = (sizingUpdater) => {
    // Use the internal state for the functional update
    const newSizing = functionalUpdate(sizingUpdater, internalColumnSizing)
    setColumnSizing(newSizing)
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
        // column sizing - use internal state for immediate updates
        columnSizing: internalColumnSizing,
        setColumnSizing,
        columnSizingUpdater,
        // global change
        setColumnsConfig: onChange,
      }}
    >
      {children}
    </ColumnSettingsContext.Provider>
  )
}

export const useColumnSettingsContext = (): ColumnSettingsContextType => {
  const context = useContext(ColumnSettingsContext)
  if (!context) {
    throw new Error('useColumnSettingsContext must be used within a ColumnSettingsProvider')
  }
  return context
}
