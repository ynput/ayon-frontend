import { FC } from 'react'
import {
  ColumnSettingsProvider,
  useProjectTableModuleContext,
} from '@shared/containers/ProjectTreeTable'
import { SettingsPanelProvider } from '@shared/context'
import { useAppSelector } from '@state/store'
import { ProjectOverviewProvider } from './context/ProjectOverviewContext'
import { ProjectDataProvider } from '../../../shared/src/containers/ProjectTreeTable/context/ProjectDataContext'
import { useUserProjectConfig } from '@shared/hooks'
import ProjectOverviewTableProvider from './ProjectOverviewTableProvider'

const ProjectOverviewDataProvider: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  const modules = useProjectTableModuleContext()
  const [pageConfig, updatePageConfig] = useUserProjectConfig({
    selectors: ['overview', projectName],
  })

  return (
    <ProjectDataProvider projectName={projectName}>
      <ColumnSettingsProvider config={pageConfig} onChange={updatePageConfig}>
        <ProjectOverviewProvider modules={modules}>
          <SettingsPanelProvider>
            <ProjectOverviewTableProvider />
          </SettingsPanelProvider>
        </ProjectOverviewProvider>
      </ColumnSettingsProvider>
    </ProjectDataProvider>
  )
}

export default ProjectOverviewDataProvider
