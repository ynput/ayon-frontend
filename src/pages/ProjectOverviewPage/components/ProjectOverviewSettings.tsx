import { useProjectTableContext } from '@containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { useSettingsPanel } from '../contexts/SettingsPanelContext'
import { SettingsPanel, SettingConfig } from './SettingsPanel'
import ColumnsSettings from './ColumnsSettings'

const StyledCustomizeButton = styled(Button)`
  min-width: 120px;
`

export const CustomizeButton = () => {
  const { togglePanel, isPanelOpen } = useSettingsPanel()

  return (
    <StyledCustomizeButton
      onClick={() => togglePanel('columns')}
      icon="settings"
      selected={isPanelOpen}
    >
      Customize
    </StyledCustomizeButton>
  )
}

const ProjectOverviewSettingsContent: FC = () => {
  const { attribFields } = useProjectTableContext()

  const columns = [
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

const ProjectOverviewSettings: FC = () => {
  return <ProjectOverviewSettingsContent />
}

export default ProjectOverviewSettings
