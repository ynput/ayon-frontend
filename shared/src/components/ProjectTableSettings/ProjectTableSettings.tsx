import {
  getLinkColumnId,
  getLinkLabel,
  getColumnLabel,
  getNameColumnLabel,
} from '@shared/containers/ProjectTreeTable/buildTreeTableColumns'
import { ENTITY_COLUMN_IDS } from '@shared/containers/ProjectTreeTable/utils/columnIds'
import { checkColumnVisibility } from '@shared/containers/ProjectTreeTable/utils/checkColumnVisibility'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable/context/ColumnSettingsContext'
import { useProjectTableContext } from '@shared/containers/ProjectTreeTable/context/ProjectTableContext'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import type { SettingHighlightedId } from '@shared/context/SettingsPanelContext'
import { useProjectContext } from '@shared/context/ProjectContext'
import { useSettingsPanel } from '@shared/context/SettingsPanelContext'
import { SettingsPanel } from '@shared/components/SettingsPanel/SettingsPanel'
import type { SettingConfig } from '@shared/components/SettingsPanel/SettingsPanel'
import { ColumnsSettingsWithContext } from './ColumnsSettings'
import { SizeSlider } from '../SizeSlider'
import { useGroupBySettings } from '@shared/containers/ProjectTreeTable/hooks/useGroupBySettings'
import { useSortBySettings } from '@shared/containers/ProjectTreeTable/hooks/useSortBySettings'

const StyledCustomizeButton = styled(Button)`
  min-width: 120px;
`

interface Props extends ButtonProps {
  defaultSelected?: string | null
}

export const CustomizeButton = ({ defaultSelected, className, ...props }: Props) => {
  const { togglePanel, isPanelOpen } = useSettingsPanel()

  return (
    <StyledCustomizeButton
      onClick={() => togglePanel(defaultSelected)}
      icon="settings"
      selected={isPanelOpen}
      {...props}
    >
      Customize
    </StyledCustomizeButton>
  )
}

export type OverviewSettingsChange = (setting: 'columns' | 'group-by', value: any) => void

export type ProjectTableSettingsProps = {
  settings?: SettingConfig[]
  extraColumns?: { value: string; label: string }[]
  hiddenColumns?: string[]
  hiddenSettings?: ('columns' | 'row-height' | 'group-by' | 'sort-by')[]
  highlighted?: SettingHighlightedId
  includeLinks?: boolean
  hideSortBy?: boolean
  order?: string[]
  scope?: string
}

export const ProjectTableSettings: FC<ProjectTableSettingsProps> = ({
  settings = [],
  extraColumns = [],
  hiddenColumns = [],
  hiddenSettings = [],
  highlighted,
  includeLinks = true,
  hideSortBy = false,
  order,
  scope,
}) => {
  const { ...projectInfo } = useProjectContext()
  const { attribFields, scopes } = useProjectTableContext()
  const {
    columnVisibility,
    defaultColumnVisibility,
    rowHeight = 34,
    updateRowHeight,
    updateRowHeightWithPersistence,
  } = useColumnSettingsContext()

  const columns: {
    value: string
    label: string
    hidden?: boolean
  }[] = [
    {
      value: 'thumbnail',
      label: getColumnLabel('thumbnail'),
    },
    {
      value: 'name',
      label: getNameColumnLabel(scopes),
    },
    {
      value: ENTITY_COLUMN_IDS.folder,
      label: getColumnLabel(ENTITY_COLUMN_IDS.folder),
    },
    {
      value: ENTITY_COLUMN_IDS.task,
      label: getColumnLabel(ENTITY_COLUMN_IDS.task),
      hidden: !['product', 'version'].some((scope) => scopes.includes(scope)),
    },
    {
      value: 'assignees',
      label: getColumnLabel('assignees'),
      hidden: !scopes.includes('task'),
    },
    {
      value: 'product',
      label: getColumnLabel('product'),
      hidden: !['product', 'version'].some((scope) => scopes.includes(scope)),
    },
    {
      value: 'entityType',
      label: getColumnLabel('entityType'),
    },
    {
      value: 'status',
      label: getColumnLabel('status'),
    },
    {
      value: 'subType',
      label: getColumnLabel('subType', scopes),
    },
    {
      value: 'tags',
      label: getColumnLabel('tags'),
    },
    {
      value: 'createdAt',
      label: getColumnLabel('createdAt'),
    },
    {
      value: 'updatedAt',
      label: getColumnLabel('updatedAt'),
    },
    {
      value: 'subtasks',
      label: getColumnLabel('subtasks'),
      hidden: !scopes.includes('task'),
    },
    {
      value: 'comments',
      label: getColumnLabel('comments'),
      hidden: !scopes.some((scope) => ['task', 'version', 'product', 'folder'].includes(scope)),
    },
    ...attribFields
      .filter((field) => field.scope?.some((scope) => scopes.includes(scope)))
      .map((field) => ({
        value: `attrib_${field.name}`,
        label: field.data.title || field.name,
      })),
    ...(projectInfo?.linkTypes && includeLinks
      ? projectInfo.linkTypes
          .filter((link) => [link.inputType, link.outputType].some((type) => scopes.includes(type)))
          .flatMap((link) => [
            {
              value: getLinkColumnId(link, 'in'),
              label: getLinkLabel(link, 'in'),
            },
            {
              value: getLinkColumnId(link, 'out'),
              label: getLinkLabel(link, 'out'),
            },
          ])
      : []),
    ...extraColumns,
  ]

  const visibleColumns = columns.filter(
    (column) => !column.hidden && !hiddenColumns.includes(column.value),
  )

  const visibleCount = visibleColumns.filter((column) =>
    checkColumnVisibility(columnVisibility, column.value, defaultColumnVisibility),
  ).length

  const groupBySettings = useGroupBySettings({ scope })
  const sortBySettings = useSortBySettings(columns)

  const defaultSettings: (SettingConfig | undefined | null)[] = [
    {
      id: 'columns',
      title: 'Columns',
      icon: 'view_column',
      preview: `${visibleCount}/${visibleColumns.length}`,
      component: <ColumnsSettingsWithContext columns={visibleColumns} highlighted={highlighted} />,
    },
    hideSortBy ? null : sortBySettings,
    groupBySettings,
    {
      id: 'row-height',
      component: (
        <SizeSlider
          value={rowHeight}
          onChange={updateRowHeight}
          onChangeComplete={updateRowHeightWithPersistence}
          title="Row height"
          id="row-height-slider"
        />
      ),
    },
  ].filter(Boolean)

  // Merge extra settings: replace defaults with matching ids, append the rest
  settings.forEach((setting) => {
    if (hiddenSettings.includes(setting.id as any)) return
    const existingIndex = defaultSettings.findIndex((s) => s && 'id' in s && s.id === setting.id)
    if (existingIndex !== -1) {
      defaultSettings[existingIndex] = setting
    } else {
      defaultSettings.push(setting)
    }
  })
  return <SettingsPanel settings={defaultSettings as SettingConfig[]} order={order} />
}
