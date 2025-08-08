import React, { createContext, useContext } from 'react'
import {
  ColumnOrderState,
  ColumnPinningState,
  OnChangeFn,
  VisibilityState,
  ColumnSizingState,
  SortingState,
} from '@tanstack/react-table'
import { GroupByConfig } from '../components/GroupSettingsFallback'

export interface TableGroupBy {
  desc: boolean
  id: string
}

export type ColumnsConfig = {
  columnVisibility: VisibilityState
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
  sorting?: SortingState
  groupBy?: TableGroupBy
  groupByConfig?: {
    showEmpty?: boolean
  }
}

export interface ColumnSettingsContextType {
  // All column IDs reference
  setAllColumns: (allColumnIds: string[]) => void

  // Column Visibility
  columnVisibility: VisibilityState
  setColumnVisibility: (columnVisibility: VisibilityState) => void
  updateColumnVisibility: (columnVisibility: VisibilityState) => void
  columnVisibilityOnChange: OnChangeFn<VisibilityState>

  // Column Pinning
  columnPinning: ColumnPinningState
  setColumnPinning: (columnPinning: ColumnPinningState) => void
  updateColumnPinning: (columnPinning: ColumnPinningState) => void
  columnPinningOnChange: OnChangeFn<ColumnPinningState>

  // Column Order
  columnOrder: ColumnOrderState
  setColumnOrder: (columnOrder: ColumnOrderState) => void
  updateColumnOrder: (columnOrder: ColumnOrderState) => void
  columnOrderOnChange: OnChangeFn<ColumnOrderState>

  // Column Sizing
  columnSizing: ColumnSizingState
  setColumnSizing: (columnSizing: ColumnSizingState) => void
  columnSizingOnChange: OnChangeFn<ColumnSizingState>

  // Sorting
  sorting: SortingState
  updateSorting: (sorting: SortingState) => void
  sortingOnChange: OnChangeFn<SortingState>

  // groupBy
  groupBy?: TableGroupBy
  updateGroupBy: (groupBy: TableGroupBy | undefined) => void
  groupByConfig: GroupByConfig
  updateGroupByConfig: (config: GroupByConfig) => void

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
