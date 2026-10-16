import { FC, useMemo } from 'react'
import {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import { checkColumnVisibility } from '@shared/containers/ProjectTreeTable'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import { ColumnsSettings } from '@shared/components/ProjectTableSettings/ColumnsSettings'
import { SettingsPanelItem } from '@shared/components/SettingsPanel'
import { SortSettings } from '@shared/components/SettingsPanel/SortSettings'
import { SettingsSortingDropdown, SortCardType } from '@ynput/ayon-react-components'
import type { ProjectGroupOption, ProjectTableRow } from '../hooks'

const SORT_OPTIONS: SettingsPanelItem[] = [
  { value: 'label', label: 'Label' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'active', label: 'Active' },
  { value: 'library', label: 'Library' },
  { value: 'pipeline', label: 'State' },
  { value: 'createdAt', label: 'Created at' },
  { value: 'updatedAt', label: 'Updated at' },
]

interface ProjectsPageTableSettingsProps {
  columns: ColumnDef<ProjectTableRow, any>[]
  columnOrder: ColumnOrderState
  columnVisibility: VisibilityState
  columnSizing: ColumnSizingState
  sorting: SortingState
  grouping: string[]
  groupSortByDesc: boolean
  groupOptions: ProjectGroupOption[]
  defaultColumnVisibility?: VisibilityState
  onColumnVisibilityChange: (visibility: VisibilityState) => void
  onColumnsConfigChange: (order: ColumnOrderState, visibility: VisibilityState) => void
  onSortingChange: (sorting: SortingState) => void
  onGroupingChange: (grouping: string[], groupSortByDesc?: boolean) => void
}

export const ProjectsPageTableSettings: FC<ProjectsPageTableSettingsProps> = ({
  columns,
  columnOrder,
  columnVisibility,
  columnSizing,
  sorting,
  grouping,
  groupSortByDesc,
  groupOptions,
  defaultColumnVisibility,
  onColumnVisibilityChange,
  onColumnsConfigChange,
  onSortingChange,
  onGroupingChange,
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

  const visibleCount = settingsColumns.filter((col) =>
    checkColumnVisibility(columnVisibility, col.value, defaultColumnVisibility),
  ).length

  // any column can be sorted from its header, so label the ones that aren't sort options
  const sortOptions = useMemo<SettingsPanelItem[]>(
    () => [
      ...SORT_OPTIONS,
      ...sorting
        .filter((s) => !SORT_OPTIONS.some((option) => option.value === s.id))
        .map((s) => ({
          value: s.id,
          label: settingsColumns.find((col) => col.value === s.id)?.label ?? s.id,
        })),
    ],
    [sorting, settingsColumns],
  )

  const sortPreview = sorting.length
    ? (sortOptions.find((option) => option.value === sorting[0].id)?.label ?? sorting[0].id) +
      (sorting.length > 1 ? ` +${sorting.length - 1}` : '')
    : 'None'

  const groupValue = useMemo<SortCardType[]>(
    () =>
      grouping
        .map((id) => {
          const option = groupOptions.find((o) => o.id === id)
          if (!option) return null
          return { ...option, sortOrder: !groupSortByDesc }
        })
        .filter(Boolean) as SortCardType[],
    [groupOptions, groupSortByDesc, grouping],
  )

  const handleGroupChange = (v: SortCardType[]) => {
    const nextGrouping = v.map((item) => item.id)
    const nextGroupSortByDesc = v[0]?.sortOrder === undefined ? groupSortByDesc : !v[0].sortOrder
    onGroupingChange(nextGrouping, nextGroupSortByDesc)
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
          defaultColumnVisibility={defaultColumnVisibility}
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
      title: 'Sort',
      icon: 'sort',
      preview: sortPreview,
      component: (
        <SortSettings sorting={sorting} options={sortOptions} onChange={onSortingChange} />
      ),
    },
    {
      id: 'group-by',
      component: (
        <SettingsSortingDropdown
          title="Group by"
          icon="splitscreen"
          value={groupValue}
          options={groupOptions}
          onChange={handleGroupChange}
          multiSelect
        />
      ),
    },
  ]

  return <SettingsPanel settings={settings} />
}
