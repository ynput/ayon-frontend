import {
  useColumnSettingsContext,
  useProjectTableContext,
  useProjectTableModuleContext,
} from '@shared/containers/ProjectTreeTable'
import { Button, ButtonProps, theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { SettingHighlightedId, useSettingsPanel } from '@shared/context'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import ColumnsSettings from './ColumnsSettings'
import clsx from 'clsx'

const StyledCustomizeButton = styled(Button)`
  min-width: 120px;
  &.count {
    min-width: 130px;
  }
`

const CustomCount = styled.span`
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-radius: 50%;
  min-width: 16px;
  min-height: 16px;

  ${theme.labelSmall}
`

interface Props extends ButtonProps {
  defaultSelected?: string | null
  count?: number // number of customizations set
}

export const CustomizeButton = ({ defaultSelected, count = 0, className, ...props }: Props) => {
  const { togglePanel, isPanelOpen } = useSettingsPanel()

  return (
    <StyledCustomizeButton
      onClick={() => togglePanel(defaultSelected)}
      icon="settings"
      selected={isPanelOpen}
      className={clsx(className, { count: count > 0 })}
      {...props}
    >
      Customize
      {!!count && <CustomCount>{count}</CustomCount>}
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
  const { attribFields } = useProjectTableContext()
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
    ...attribFields.map((field) => ({
      value: 'attrib_' + field.name,
      label: field.data.title || field.name,
    })),
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

  return <SettingsPanel settings={defaultSettings} />
}
