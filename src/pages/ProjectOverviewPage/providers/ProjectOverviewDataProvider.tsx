import { FC } from 'react'
import {
  ColumnSettingsProvider,
  ProjectDataProvider,
  useProjectTableModules,
} from '@shared/containers/ProjectTreeTable'
import { SettingsPanelProvider, MoveEntityProvider } from '@shared/context'
import { useAppSelector } from '@state/store'
import { ProjectOverviewProvider } from '../context/ProjectOverviewContext'
import ProjectOverviewTableProvider from './ProjectOverviewTableProvider'
import { useOverviewViewSettings } from '@shared/containers'

const ProjectOverviewDataProvider: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  const { columns, onUpdateColumns } = useOverviewViewSettings()

  const modules = useProjectTableModules()

  return (
    <ProjectDataProvider projectName={projectName}>
      <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
        <MoveEntityProvider>
          <ProjectOverviewProvider modules={modules}>
            <SettingsPanelProvider>
              <ProjectOverviewTableProvider modules={modules} />
            </SettingsPanelProvider>
          </ProjectOverviewProvider>
        </MoveEntityProvider>
      </ColumnSettingsProvider>
    </ProjectDataProvider>
  )
}

export default ProjectOverviewDataProvider
