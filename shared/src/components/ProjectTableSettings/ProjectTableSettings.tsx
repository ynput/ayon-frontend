import {
  useColumnSettingsContext,
  useProjectTableContext,
  useProjectTableModuleContext,
} from '@shared/containers/ProjectTreeTable'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { SettingHighlightedId, useSettingsPanel } from '@shared/context'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import ColumnsSettings from './ColumnsSettings'
import { getAttributeIcon } from '@shared/util'

const StyledCustomizeButton = styled(Button)`
  min-width: 120px;
`

interface Props extends ButtonProps {
  defaultSelected?: string | null
}

export const CustomizeButton = ({ defaultSelected, ...props }: Props) => {
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

type ProjectTableSettingsProps = {
  settings?: SettingConfig[]
  extraColumns?: { value: string; label: string }[]
  highlighted?: SettingHighlightedId
  onChange?: OverviewSettingsChange
}

export const ProjectTableSettings: FC<ProjectTableSettingsProps> = ({
  settings = [],
  extraColumns = [],
  highlighted,
  onChange,
}) => {
  const { attribFields } = useProjectTableContext()
  const { columnVisibility, groupBy } = useColumnSettingsContext()
  const { GroupSettings, requiredVersion } = useProjectTableModuleContext()

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
    ...attribFields.map((field) => ({
      value: 'attrib_' + field.name,
      label: field.data.title || field.name,
    })),
    ...extraColumns,
  ]

  // @martastain says list_of_* is a pita to implement, so we are not supporting it for now
  const allowedGroupByFields = ['string', 'boolean', 'integer', 'float']

  const groupByFields = [
    {
      value: 'subType',
      label: 'Task Type',
      icon: getAttributeIcon('task'),
    },
    {
      value: 'assignees',
      label: 'Assignees',
      icon: getAttributeIcon('assignees'),
    },
    {
      value: 'status',
      label: 'Status',
      icon: getAttributeIcon('status'),
    },
    {
      value: 'tags',
      label: 'Tags',
      icon: getAttributeIcon('tags'),
    },
    ...attribFields
      .filter((attrib) => allowedGroupByFields.includes(attrib.data.type))
      .map((field) => ({
        value: 'attrib_' + field.name,
        label: field.data.title || field.name,
        icon: getAttributeIcon(field.name),
      })),
    ...extraColumns.map((column) => ({
      value: column.value,
      label: column.label,
      icon: getAttributeIcon(column.value),
    })),
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
    {
      id: 'group-by',
      title: 'Group',
      icon: 'splitscreen',
      preview: groupBy
        ? groupByFields.find((f) => f.value === groupBy.id)?.label ?? groupBy.id
        : 'None',
      component: (
        <GroupSettings
          fields={groupByFields}
          onChange={(v) => onChange?.('group-by', v)}
          requiredVersion={requiredVersion}
        />
      ),
    },
  ]

  settings.forEach((setting) => defaultSettings.push(setting))

  return <SettingsPanel settings={defaultSettings} />
}
