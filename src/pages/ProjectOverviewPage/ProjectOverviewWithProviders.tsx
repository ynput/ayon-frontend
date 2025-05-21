import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import {
  ProjectTableProvider,
  SelectionCellsProvider,
  SelectedRowsProvider,
  ColumnSettingsProvider,
  CellEditingProvider,
} from '@shared/containers/ProjectTreeTable'
import { NewEntityProvider } from '@context/NewEntityContext'
import { SettingsPanelProvider } from '@shared/context'
import { useAppSelector } from '@state/store'
import {
  ProjectOverviewProvider,
  useProjectOverviewContext,
} from './context/ProjectOverviewContext'
import { ProjectDataProvider } from './context/ProjectDataContext'
import { ProjectTableQueriesProvider } from '@shared/containers/ProjectTreeTable/context/ProjectTableQueriesContext'
import { useUserProjectConfig } from '@shared/hooks'
import useTableQueriesHelper from './hooks/useTableQueriesHelper'

const ProjectOverviewWithProviders: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''
  return (
    <ProjectDataProvider projectName={projectName}>
      <ProjectOverviewProvider>
        <SettingsPanelProvider>
          <ProjectOverviewWithTableProviders />
        </SettingsPanelProvider>
      </ProjectOverviewProvider>
    </ProjectDataProvider>
  )
}

const ProjectOverviewWithTableProviders: FC = () => {
  const props = useProjectOverviewContext()
  const [pageConfig, updatePageConfig] = useUserProjectConfig({
    selectors: ['overview', props.projectName],
  })

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: props.projectName,
  })

  return (
    <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
      <ProjectTableProvider {...props}>
        <NewEntityProvider>
          <SelectionCellsProvider>
            <SelectedRowsProvider>
              <ColumnSettingsProvider config={pageConfig} onChange={updatePageConfig}>
                <CellEditingProvider>
                  <ProjectOverviewPage />
                </CellEditingProvider>
              </ColumnSettingsProvider>
            </SelectedRowsProvider>
          </SelectionCellsProvider>
        </NewEntityProvider>
      </ProjectTableProvider>
    </ProjectTableQueriesProvider>
  )
}

export default ProjectOverviewWithProviders
