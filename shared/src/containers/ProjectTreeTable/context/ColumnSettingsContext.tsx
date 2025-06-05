import React, { createContext, useContext } from 'react'
import {
  ColumnOrderState,
  ColumnPinningState,
  OnChangeFn,
  VisibilityState,
  ColumnSizingState,
} from '@tanstack/react-table'

export interface TableGroupBy {
  desc: boolean
  id: string
}

export type ColumnsConfig = {
  columnVisibility: VisibilityState
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
  groupBy?: TableGroupBy
}

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

  // groupBy
  updateGroupBy: (groupBy: TableGroupBy | undefined) => void
  groupBy?: TableGroupBy

  // Global change
  setColumnsConfig: (config: ColumnsConfig) => void
}

export const ColumnSettingsContext = createContext<ColumnSettingsContextType | undefined>(undefined)

export const useColumnSettingsContext = (): ColumnSettingsContextType => {
  const context = useContext(ColumnSettingsContext)
  if (!context) {
    throw new Error('useColumnSettingsContext must be used within a ColumnSettingsProvider')
  }
  return context
}
