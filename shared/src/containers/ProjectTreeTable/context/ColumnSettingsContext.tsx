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
  // Column Visibility
  columnVisibility: VisibilityState
  setColumnVisibility: (columnVisibility: VisibilityState, allColumnIds?: string[]) => void
  updateColumnVisibility: (columnVisibility: VisibilityState) => void
  columnVisibilityUpdater: OnChangeFn<VisibilityState>

  // Column Pinning
  columnPinning: ColumnPinningState
  setColumnPinning: (columnPinning: ColumnPinningState, allColumnIds?: string[]) => void
  updateColumnPinning: (columnPinning: ColumnPinningState) => void
  columnPinningUpdater: OnChangeFn<ColumnPinningState>

  // Column Order
  columnOrder: ColumnOrderState
  setColumnOrder: (columnOrder: ColumnOrderState, allColumnIds?: string[]) => void
  updateColumnOrder: (columnOrder: ColumnOrderState) => void
  columnOrderUpdater: OnChangeFn<ColumnOrderState>

  // Column Sizing
  columnSizing: ColumnSizingState
  setColumnSizing: (columnSizing: ColumnSizingState, allColumnIds?: string[]) => void
  columnSizingUpdater: OnChangeFn<ColumnSizingState>

  // Sorting
  sorting: SortingState
  setSorting: (sorting: SortingState, allColumnIds?: string[]) => void
  updateSorting: (sorting: SortingState) => void
  sortingUpdater: OnChangeFn<SortingState>

  // Unified updaters with all column IDs support
  createUpdaterWithAllColumns: {
    columnVisibility: (allColumnIds: string[]) => OnChangeFn<VisibilityState>
    columnPinning: (allColumnIds: string[]) => OnChangeFn<ColumnPinningState>
    columnOrder: (allColumnIds: string[]) => OnChangeFn<ColumnOrderState>
    columnSizing: (allColumnIds: string[]) => OnChangeFn<ColumnSizingState>
    sorting: (allColumnIds: string[]) => OnChangeFn<SortingState>
  }

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
