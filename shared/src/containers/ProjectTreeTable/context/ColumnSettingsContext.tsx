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
import { SummaryCalc, SummaryFormat, RowScope } from '../types/summaryTypes'

export interface TableGroupBy {
  desc: boolean
  id: string
}

export type ColumnsConfig = {
  columnVisibility: VisibilityState
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
  // per-column summary footer calc type, keyed by column id
  columnSummaries?: Record<string, SummaryCalc>
  // per-column summary row scope (folders/tasks toggles), keyed by column id
  columnSummaryScopes?: Record<string, RowScope>
  // per-column summary display format (count/percentage toggles), keyed by column id
  columnSummaryFormats?: Record<string, SummaryFormat>
  sorting?: SortingState
  groupBy?: TableGroupBy
  groupByConfig?: {
    showEmpty?: boolean
  }
  rowHeight?: number
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

  // Column summary calc type (footer)
  columnSummaries: Record<string, SummaryCalc>
  updateColumnSummary: (columnId: string, calc: SummaryCalc) => void

  // Column summary row scope (footer)
  columnSummaryScopes: Record<string, RowScope>
  updateColumnSummaryScope: (columnId: string, scope: RowScope) => void

  // Column summary display format (footer)
  columnSummaryFormats: Record<string, SummaryFormat>
  updateColumnSummaryFormat: (columnId: string, format: SummaryFormat) => void

  // Sorting
  sorting: SortingState
  updateSorting: (sorting: SortingState) => void
  sortingOnChange: OnChangeFn<SortingState>

  // groupBy
  groupBy?: TableGroupBy
  updateGroupBy: (groupBy: TableGroupBy | undefined) => void
  groupByConfig: GroupByConfig
  updateGroupByConfig: (config: GroupByConfig) => void

  // Row height
  rowHeight?: number
  updateRowHeight: (rowHeight: number) => void
  updateRowHeightWithPersistence: (rowHeight: number) => void

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
