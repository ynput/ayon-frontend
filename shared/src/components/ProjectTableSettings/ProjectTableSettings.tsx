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
}

export const ProjectTableSettings: FC<ProjectTableSettingsProps> = ({
  settings = [],
  extraColumns = [],
  highlighted,
}) => {
  const { attribFields, projectInfo } = useProjectTableContext()
  const { columnVisibility } = useColumnSettingsContext()

  const columns = [
    {
      value: 'thumbnail',
      label: 'Thumbnail',
    },
    {
      value: 'name',
      label: 'Folder / Task',
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
      value: 'assignees',
      label: 'Assignees',
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
    ...attribFields.map((field) => ({
      value: `attrib_${field.name}`,
      label: field.data.title || field.name,
    })),
    ...(projectInfo?.linkTypes
      ? projectInfo.linkTypes.flatMap((link) => [
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
  ]

  settings.forEach((setting) => defaultSettings.push(setting))
  console.log('Settingds ', defaultSettings)
  return <SettingsPanel settings={defaultSettings} />
}
