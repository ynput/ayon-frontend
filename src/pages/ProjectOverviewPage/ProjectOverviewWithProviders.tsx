import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import {
  ProjectTableProvider,
  SelectionCellsProvider,
  SelectedRowsProvider,
  ColumnSettingsProvider,
  CellEditingProvider,
  ProjectTableModuleProvider,
} from '@shared/containers/ProjectTreeTable'
import { NewEntityProvider } from '@context/NewEntityContext'
import { SettingsPanelProvider, usePowerpack } from '@shared/context'
import { useAppSelector } from '@state/store'
import {
  ProjectOverviewProvider,
  useProjectOverviewContext,
} from './context/ProjectOverviewContext'
import { ProjectDataProvider } from '../../../shared/src/containers/ProjectTreeTable/context/ProjectDataContext'
import { ProjectTableQueriesProvider } from '@shared/containers/ProjectTreeTable/context/ProjectTableQueriesContext'
import { useUserProjectConfig } from '@shared/hooks'
import useTableQueriesHelper from './hooks/useTableQueriesHelper'

const ProjectOverviewWithProviders: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  const [pageConfig, updatePageConfig] = useUserProjectConfig({
    selectors: ['overview', projectName],
  })

  return (
    <ProjectTableModuleProvider>
      <ProjectDataProvider projectName={projectName}>
        <ColumnSettingsProvider config={pageConfig} onChange={updatePageConfig}>
          <ProjectOverviewProvider>
            <SettingsPanelProvider>
              <ProjectOverviewWithTableProviders />
            </SettingsPanelProvider>
          </ProjectOverviewProvider>
        </ColumnSettingsProvider>
      </ProjectDataProvider>
    </ProjectTableModuleProvider>
  )
}

const ProjectOverviewWithTableProviders: FC = () => {
  const props = useProjectOverviewContext()

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: props.projectName,
  })

  const powerpack = usePowerpack()

  return (
    <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
      <ProjectTableProvider {...props} powerpack={powerpack}>
        <NewEntityProvider>
          <SelectionCellsProvider>
            <SelectedRowsProvider>
              <CellEditingProvider>
                <ProjectOverviewPage />
              </CellEditingProvider>
            </SelectedRowsProvider>
          </SelectionCellsProvider>
        </NewEntityProvider>
      </ProjectTableProvider>
    </ProjectTableQueriesProvider>
  )
}

export default ProjectOverviewWithProviders
