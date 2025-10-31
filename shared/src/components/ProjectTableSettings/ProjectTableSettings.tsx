import {
  getLinkColumnId,
  getLinkLabel,
  useColumnSettingsContext,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { SettingHighlightedId, useSettingsPanel } from '@shared/context'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import ColumnsSettings from './ColumnsSettings'
import { SizeSlider } from '@shared/components'
import { useGroupBySettings } from '@shared/containers/ProjectTreeTable/hooks/useGroupBySettings'

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
  hiddenSettings?: ('columns' | 'row-height' | 'group-by')[]
  highlighted?: SettingHighlightedId
  includeLinks?: boolean
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
  order,
  scope,
}) => {
  const { attribFields, projectInfo, scopes } = useProjectTableContext()
  const {
    columnVisibility,
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
      label: 'Thumbnail',
    },
    {
      value: 'name',
      label:
        scopes.map((scope) => scope.charAt(0).toUpperCase() + scope.slice(1)).join('/') + ' Name',
    },
    {
      value: 'folder',
      label: 'Folder',
    },
    {
      value: 'assignees',
      label: 'Assignees',
      hidden: !scopes.includes('task'),
    },
    {
      value: 'product',
      label: 'Product name',
      hidden: ['product', 'version'].some((scope) => !scopes.includes(scope)),
    },
    {
      value: 'entityType',
      label: 'Entity type',
    },
    {
      value: 'status',
      label: 'Status',
    },
    {
      value: 'subType',
      label: 'Type',
    },
    {
      value: 'tags',
      label: 'Tags',
    },
    {
      value: 'createdAt',
      label: 'Created At',
    },
    {
      value: 'updatedAt',
      label: 'Updated At',
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

  const visibleCount = visibleColumns.filter(
    (column) => !(column.value in columnVisibility) || columnVisibility[column.value],
  ).length

  const groupBySettings = useGroupBySettings({ scope })

  const defaultSettings: SettingConfig[] = [
    {
      id: 'columns',
      title: 'Columns',
      icon: 'view_column',
      preview: `${visibleCount}/${visibleColumns.length}`,
      component: <ColumnsSettings columns={visibleColumns} highlighted={highlighted} />,
    },
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
  ]

  settings.forEach(
    (setting) => !hiddenSettings.includes(setting.id as any) && defaultSettings.push(setting),
  )
  return <SettingsPanel settings={defaultSettings} order={order} />
}
