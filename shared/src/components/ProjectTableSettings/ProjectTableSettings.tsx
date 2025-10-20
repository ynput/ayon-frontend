import {
  getLinkColumnId,
  getLinkLabel,
  useColumnSettingsContext,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import { Button, ButtonProps, theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { SettingHighlightedId, useSettingsPanel } from '@shared/context'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import ColumnsSettings from './ColumnsSettings'
import RowHeightSettings from './RowHeightSettings'

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
  highlighted?: SettingHighlightedId
  includeLinks?: boolean
}

export const ProjectTableSettings: FC<ProjectTableSettingsProps> = ({
  settings = [],
  extraColumns = [],
  highlighted,
  includeLinks = true,
}) => {
  const { attribFields, projectInfo, scopes } = useProjectTableContext()
  const { columnVisibility } = useColumnSettingsContext()

  const columns = [
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

  // add assignees column for task scope
  if (scopes.includes('task')) {
    columns.splice(4, 0, {
      value: 'assignees',
      label: 'Assignees',
    })
  }

  const visibleCount = columns.filter(
    (column) => !(column.value in columnVisibility) || columnVisibility[column.value],
  ).length

  const defaultSettings: SettingConfig[] = [
    {
      id: 'columns',
      title: 'Columns',
      icon: 'view_column',
      preview: `${visibleCount}/${columns.length}`,
      component: <ColumnsSettings columns={columns} highlighted={highlighted} />,
    },
    {
      component: <RowHeightSettings />,
    },
  ]

  settings.forEach((setting) => defaultSettings.push(setting))
  return <SettingsPanel settings={defaultSettings} />
}
