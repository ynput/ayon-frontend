import { useProjectTableContext } from '@shared/containers/ProjectTreeTable'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { useSettingsPanel } from '@shared/context'
import { SettingsPanel, SettingConfig } from '@shared/components/SettingsPanel'
import ColumnsSettings from './ColumnsSettings'

const StyledCustomizeButton = styled(Button)`
  min-width: 120px;
`

interface Props extends ButtonProps {}

export const CustomizeButton = ({ ...props }: Props) => {
  const { togglePanel, isPanelOpen } = useSettingsPanel()

  return (
    <StyledCustomizeButton
      onClick={() => togglePanel('columns')}
      icon="settings"
      selected={isPanelOpen}
      {...props}
    >
      Customize
    </StyledCustomizeButton>
  )
}

type ProjectTableSettingsProps = {
  extraColumns?: { value: string; label: string }[]
}

export const ProjectTableSettings: FC<ProjectTableSettingsProps> = ({ extraColumns = [] }) => {
  const { attribFields } = useProjectTableContext()

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

  const settings: SettingConfig[] = [
    {
      id: 'columns',
      title: 'Columns',
      component: <ColumnsSettings columns={columns} />,
    },
  ]

  return <SettingsPanel settings={settings} />
}
