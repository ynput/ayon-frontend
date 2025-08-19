import { FC } from 'react'
import {
  ColumnSettingsProvider,
  ProjectDataProvider,
  useProjectTableModules,
} from '@shared/containers/ProjectTreeTable'
import { SettingsPanelProvider } from '@shared/context'
import { useAppSelector } from '@state/store'
import { ProjectOverviewProvider } from '../context/ProjectOverviewContext'
import ProjectOverviewTableProvider from './ProjectOverviewTableProvider'
import { useOverviewViewSettings } from '@shared/containers'
import {MoveEntityProvider} from "@shared/containers/ProjectTreeTable/context/MoveEnitityContext.tsx";

const ProjectOverviewDataProvider: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  const { columns, onUpdateColumns } = useOverviewViewSettings()

  const modules = useProjectTableModules()

  return (
    <ProjectDataProvider projectName={projectName}>
      <MoveEntityProvider>
      <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
        <ProjectOverviewProvider modules={modules}>
          <SettingsPanelProvider>
            <ProjectOverviewTableProvider modules={modules} />
          </SettingsPanelProvider>
        </ProjectOverviewProvider>
      </ColumnSettingsProvider>
      </MoveEntityProvider>
    </ProjectDataProvider>
  )
}

export default ProjectOverviewDataProvider
