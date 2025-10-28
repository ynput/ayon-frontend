import { FC } from 'react'
import { ColumnSettingsProvider, ProjectDataProvider } from '@shared/containers/ProjectTreeTable'
import { useGroupByRemoteModules } from '@shared/hooks'
import { SettingsPanelProvider, MoveEntityProvider } from '@shared/context'
import { useAppSelector } from '@state/store'
import { ProjectOverviewProvider } from '../context/ProjectOverviewContext'
import ProjectOverviewTableProvider from './ProjectOverviewTableProvider'
import { useOverviewViewSettings } from '@shared/containers'

const ProjectOverviewDataProvider: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  const { columns, onUpdateColumns } = useOverviewViewSettings()

  const modules = useGroupByRemoteModules()

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
