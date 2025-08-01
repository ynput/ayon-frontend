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
import { usePageViewColumns } from '@shared/containers'

const ProjectOverviewDataProvider: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  const { columns, onUpdateColumns } = usePageViewColumns()

  const modules = useProjectTableModules()

  return (
    <ProjectDataProvider projectName={projectName}>
      <ColumnSettingsProvider config={columns} onChange={onUpdateColumns}>
        <ProjectOverviewProvider modules={modules}>
          <SettingsPanelProvider>
            <ProjectOverviewTableProvider modules={modules} />
          </SettingsPanelProvider>
        </ProjectOverviewProvider>
      </ColumnSettingsProvider>
    </ProjectDataProvider>
  )
}

export default ProjectOverviewDataProvider
