import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import {
  ProjectTableProvider,
  SelectionCellsProvider,
  SelectedRowsProvider,
  ColumnSettingsProvider,
  CellEditingProvider,
  ProjectTableModuleProvider,
  useProjectTableModuleContext,
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

const WithModulesProvider: FC = () => {
  return (
    <ProjectTableModuleProvider>
      <ProjectOverviewWithProviders />
    </ProjectTableModuleProvider>
  )
}

const ProjectOverviewWithProviders: FC = () => {
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
            <ProjectOverviewWithTableProviders />
          </SettingsPanelProvider>
        </ProjectOverviewProvider>
      </ColumnSettingsProvider>
    </ProjectDataProvider>
  )
}

const ProjectOverviewWithTableProviders: FC = () => {
  const props = useProjectOverviewContext()
  const modules = useProjectTableModuleContext()

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: props.projectName,
  })

  const powerpack = usePowerpack()

  return (
    <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
      <ProjectTableProvider
        {...props}
        powerpack={powerpack}
        modules={modules}
        groupByConfig={{ entityType: 'task' }}
      >
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

export default WithModulesProvider
