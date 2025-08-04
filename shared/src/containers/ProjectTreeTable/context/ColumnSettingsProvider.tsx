import React, { ReactNode, useState } from 'react'
import {
  ColumnOrderState,
  ColumnPinningState,
  functionalUpdate,
  OnChangeFn,
  VisibilityState,
  ColumnSizingState,
  SortingState,
} from '@tanstack/react-table'
import { ROW_SELECTION_COLUMN_ID } from './SelectionCellsContext'
import { DRAG_HANDLE_COLUMN_ID } from '../ProjectTreeTable'
import { ColumnsConfig, ColumnSettingsContext, TableGroupBy } from './ColumnSettingsContext'
import { GroupByConfig } from '../components/GroupSettingsFallback'

interface ColumnSettingsProviderProps {
  children: ReactNode
  config?: Record<string, any>
  onChange: (config: ColumnsConfig, allColumnIds?: string[]) => void
}

export const ColumnSettingsProvider: React.FC<ColumnSettingsProviderProps> = ({
  children,
  config,
  onChange,
}) => {
  const columnsConfig = config as ColumnsConfig
  const {
    columnOrder: columnOrderInit = [],
    columnPinning: columnPinningInit = {},
    columnVisibility: columnVisibilityInit = {},
    columnSizing: columnsSizingExternal = {},
    sorting: sortingInit = [],
    groupBy,
    groupByConfig = {},
  } = columnsConfig

  const sorting = [...sortingInit]
  const columnOrder = [...columnOrderInit]
  const columnPinning = { ...columnPinningInit }
  const defaultOrder = ['thumbnail', 'name', 'subType', 'status', 'tags']
  // for each default column, if it is not in the columnOrder, find the index of the column before it, if none, add to beginning
  defaultOrder.forEach((col, i) => {
    if (!columnOrder.includes(col)) {
      const defaultBefore = defaultOrder[i - 1]
      const columnAfter = defaultOrder[i + 1]
      if (!defaultBefore || !columnOrder.includes(defaultBefore)) {
        // add to beginning
        columnOrder.unshift(col)
      } else {
        // find the index of that column in the columnOrder
        const index = columnOrder.indexOf(defaultBefore)
        // add the item after that column
        columnOrder.splice(index + 1, 0, col)
      }
      if (columnAfter && columnPinning?.left && columnPinning?.left.includes(columnAfter)) {
        // pin the column
        columnPinning.left = [col, ...(columnPinning?.left || [])]
      }
    }
  })

  // if we are in grouping mode, always pin the name column
  // and ensure it is first in column order
  if (groupBy) {
    // ensure name column is pinned and first in pinning order
    if (!columnPinning.left?.includes('name')) {
      columnPinning.left = ['name', ...(columnPinning?.left || [])]
    } else {
      // name is already pinned, but ensure it's first
      const filteredPinned = columnPinning.left.filter((col) => col !== 'name')
      columnPinning.left = ['name', ...filteredPinned]
    }

    // ensure name is first in column order
    if (columnOrder.includes('name')) {
      // remove name from its current position
      const nameIndex = columnOrder.indexOf('name')
      columnOrder.splice(nameIndex, 1)
    }
    // add name to the beginning
    columnOrder.unshift('name')
  }

  // add drag handle and selection columns to the beginning of the column order
  columnOrder.unshift(...[DRAG_HANDLE_COLUMN_ID, ROW_SELECTION_COLUMN_ID])

  // VISIBILITY STATE MUTATIONS
  const columnVisibility = { ...columnVisibilityInit }
  // if we are in grouping mode, name column must always be visible
  if (groupBy && !columnVisibility.name) {
    columnVisibility.name = true
  }

  // DIRECT STATE UPDATES - no side effects
  const setColumnVisibility = (visibility: VisibilityState, allColumnIds?: string[]) => {
    onChange(
      {
        ...columnsConfig,
        columnVisibility: visibility,
      },
      allColumnIds,
    )
  }

  const setColumnOrder = (order: ColumnOrderState, allColumnIds?: string[]) => {
    onChange(
      {
        ...columnsConfig,
        columnOrder: order,
      },
      allColumnIds,
    )
  }

  const setColumnPinning = (pinning: ColumnPinningState, allColumnIds?: string[]) => {
    onChange(
      {
        ...columnsConfig,
        columnPinning: pinning,
      },
      allColumnIds,
    )
  }

  const [internalColumnSizing, setInternalColumnSizing] = useState<ColumnSizingState | null>(null)

  // use internalColumnSizing if it exists, otherwise use the external column sizing
  const columnSizing = internalColumnSizing || columnsSizingExternal

  const resizingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const setColumnSizing = (sizing: ColumnSizingState, allColumnIds?: string[]) => {
    setInternalColumnSizing(sizing)

    // if there is a timeout already set, clear it
    if (resizingTimeoutRef.current) {
      clearTimeout(resizingTimeoutRef.current)
    }
    // set a timeout that tracks if the column sizing has finished
    resizingTimeoutRef.current = setTimeout(() => {
      // we have finished resizing now!
      // update the external column sizing
      onChange(
        {
          ...columnsConfig,
          columnSizing: sizing,
        },
        allColumnIds,
      )
      // reset the internal column sizing to not be used anymore
      setInternalColumnSizing(null)
    }, 500)
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

  const updateSorting = (sortingState: SortingState) => {
    onChange({
      ...columnsConfig,
      sorting: sortingState,
    })
  }

  const updateGroupBy = (groupBy: TableGroupBy | undefined) => {
    onChange({
      ...columnsConfig,
      groupBy: groupBy,
    })
  }

  const updateGroupByConfig = (config: GroupByConfig) => {
    onChange({
      ...columnsConfig,
      groupByConfig: {
        ...groupByConfig,
        ...config,
      },
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
    const newSizing = functionalUpdate(sizingUpdater, columnSizing)
    setColumnSizing(newSizing)
  }

  const sortingUpdater: OnChangeFn<SortingState> = (sortingUpdater) => {
    const newSorting = functionalUpdate(sortingUpdater, sorting)
    updateSorting(newSorting)
  }

  // UNIFIED UPDATERS WITH ALL COLUMN IDS
  const createUpdaterWithAllColumns = {
    columnVisibility:
      (allColumnIds: string[]): OnChangeFn<VisibilityState> =>
      (updater) => {
        const newVisibility = functionalUpdate(updater, columnVisibility)
        setColumnVisibility(newVisibility, allColumnIds)
      },
    columnPinning:
      (allColumnIds: string[]): OnChangeFn<ColumnPinningState> =>
      (updater) => {
        const newPinning = functionalUpdate(updater, columnPinning)
        setColumnPinning(newPinning, allColumnIds)
      },
    columnOrder:
      (allColumnIds: string[]): OnChangeFn<ColumnOrderState> =>
      (updater) => {
        const newOrder = functionalUpdate(updater, columnOrder)
        setColumnOrder(newOrder, allColumnIds)
      },
    columnSizing:
      (allColumnIds: string[]): OnChangeFn<ColumnSizingState> =>
      (updater) => {
        const newSizing = functionalUpdate(updater, columnSizing)
        setColumnSizing(newSizing, allColumnIds)
      },
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
        // column sizing
        columnSizing,
        setColumnSizing,
        columnSizingUpdater,
        // sorting
        sorting,
        updateSorting,
        sortingUpdater,
        // unified updaters
        createUpdaterWithAllColumns,
        // group by
        groupBy,
        updateGroupBy,
        groupByConfig,
        updateGroupByConfig,

        // global change
        setColumnsConfig: (config: ColumnsConfig) => onChange(config),
      }}
    >
      {children}
    </ColumnSettingsContext.Provider>
  )
}
