import { FC, useMemo } from 'react'
import {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { ColumnSettingsContext, ColumnSettingsContextType } from '@shared/containers'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import ColumnsSettings from '@shared/components/ProjectTableSettings/ColumnsSettings'
import { SettingsPanelItem } from '@shared/components/SettingsPanel'
import { SettingsSortingDropdown, SortCardType } from '@ynput/ayon-react-components'
import type { ProjectTableRow } from '../hooks'

const SORT_OPTIONS = [
  { id: 'label', label: 'Label' },
  { id: 'name', label: 'Name' },
  { id: 'code', label: 'Code' },
  { id: 'active', label: 'Active' },
  { id: 'library', label: 'Library' },
  { id: 'createdAt', label: 'Created at' },
  { id: 'updatedAt', label: 'Updated at' },
]

interface ProjectsPageTableSettingsProps {
  columns: ColumnDef<ProjectTableRow, any>[]
  columnOrder: ColumnOrderState
  columnVisibility: VisibilityState
  columnSizing: ColumnSizingState
  sorting: SortingState
  onColumnOrderChange: (order: ColumnOrderState) => void
  onColumnVisibilityChange: (visibility: VisibilityState) => void
  onSortingChange: (sorting: SortingState) => void
}

export const ProjectsPageTableSettings: FC<ProjectsPageTableSettingsProps> = ({
  columns,
  columnOrder,
  columnVisibility,
  columnSizing,
  sorting,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onSortingChange,
}) => {
  const settingsColumns = useMemo<SettingsPanelItem[]>(
    () =>
      columns
        .filter((col) => col.id)
        .map((col) => ({
          value: col.id as string,
          label: typeof col.header === 'string' ? col.header : (col.id as string),
        })),
    [columns],
  )

  const contextValue = useMemo<ColumnSettingsContextType>(
    () => ({
      setAllColumns: () => {},
      columnVisibility,
      setColumnVisibility: onColumnVisibilityChange,
      updateColumnVisibility: onColumnVisibilityChange,
      columnVisibilityOnChange: (updater) => {
        const newVal = typeof updater === 'function' ? updater(columnVisibility) : updater
        onColumnVisibilityChange(newVal)
      },
      columnPinning: {},
      setColumnPinning: () => {},
      updateColumnPinning: () => {},
      columnPinningOnChange: () => {},
      columnOrder,
      setColumnOrder: onColumnOrderChange,
      updateColumnOrder: onColumnOrderChange,
      columnOrderOnChange: (updater) => {
        const newVal = typeof updater === 'function' ? updater(columnOrder) : updater
        onColumnOrderChange(newVal)
      },
      columnSizing,
      setColumnSizing: () => {},
      columnSizingOnChange: () => {},
      sorting,
      updateSorting: onSortingChange,
      sortingOnChange: (updater) => {
        const newVal = typeof updater === 'function' ? updater(sorting) : updater
        onSortingChange(newVal)
      },
      groupBy: undefined,
      updateGroupBy: () => {},
      groupByConfig: {},
      updateGroupByConfig: () => {},
      rowHeight: 34,
      updateRowHeight: () => {},
      updateRowHeightWithPersistence: () => {},
      setColumnsConfig: (config) => {
        onColumnOrderChange(config.columnOrder)
        onColumnVisibilityChange(config.columnVisibility)
        if (config.sorting) onSortingChange(config.sorting)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnVisibility, columnOrder, columnSizing, sorting],
  )

  const visibleCount = settingsColumns.filter(
    (col) => !(col.value in columnVisibility) || columnVisibility[col.value] !== false,
  ).length

  const sortValue = useMemo<SortCardType[]>(
    () =>
      sorting
        .map((s) => {
          const option = SORT_OPTIONS.find((o) => o.id === s.id)
          if (!option) return null
          return { ...option, sortOrder: !s.desc }
        })
        .filter(Boolean) as SortCardType[],
    [sorting],
  )

  const handleSortChange = (v: SortCardType[]) => {
    onSortingChange(v.map((item) => ({ id: item.id, desc: !item.sortOrder })))
  }

  const settings: SettingConfig[] = [
    {
      id: 'columns',
      title: 'Columns',
      icon: 'view_column',
      preview: `${visibleCount}/${settingsColumns.length}`,
      component: <ColumnsSettings columns={settingsColumns} />,
    },
    {
      id: 'sort-by',
      component: (
        <SettingsSortingDropdown
          title="Sort by"
          icon="sort"
          value={sortValue}
          options={SORT_OPTIONS}
          onChange={handleSortChange}
          multiSelect={false}
        />
      ),
    },
  ]

  return (
    <ColumnSettingsContext.Provider value={contextValue}>
      <SettingsPanel settings={settings} />
    </ColumnSettingsContext.Provider>
  )
}
