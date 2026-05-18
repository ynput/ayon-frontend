import { FC, useMemo } from 'react'
import {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import { ColumnsSettings } from '@shared/components/ProjectTableSettings/ColumnsSettings'
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
  onColumnVisibilityChange: (visibility: VisibilityState) => void
  onColumnsConfigChange: (order: ColumnOrderState, visibility: VisibilityState) => void
  onSortingChange: (sorting: SortingState) => void
}

export const ProjectsPageTableSettings: FC<ProjectsPageTableSettingsProps> = ({
  columns,
  columnOrder,
  columnVisibility,
  columnSizing,
  sorting,
  onColumnVisibilityChange,
  onColumnsConfigChange,
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
      component: (
        <ColumnsSettings
          columns={settingsColumns}
          columnVisibility={columnVisibility}
          updateColumnVisibility={onColumnVisibilityChange}
          columnPinning={{}}
          updateColumnPinning={() => {}}
          columnOrder={columnOrder}
          setColumnsConfig={(config) => {
            onColumnsConfigChange(config.columnOrder, config.columnVisibility)
          }}
          columnSizing={columnSizing}
          sorting={sorting}
          rowHeight={34}
        />
      ),
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

  return <SettingsPanel settings={settings} />
}
