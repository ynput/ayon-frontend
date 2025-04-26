import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import {
  ProjectTableProvider,
  SelectionProvider,
  SelectedRowsProvider,
  ColumnSettingsProvider,
  CellEditingProvider,
} from '@shared/containers/ProjectTreeTable'
import { NewEntityProvider } from '@context/NewEntityContext'
import { SettingsPanelProvider } from './context/SettingsPanelContext'
import { useAppSelector } from '@state/store'
import {
  ProjectOverviewProvider,
  useProjectOverviewContext,
} from './context/ProjectOverviewContext'
import { ProjectDataProvider } from './context/ProjectDataContext'
import { useUpdateOverviewEntitiesMutation } from '@queries/overview/updateOverview'
import {
  ProjectTableQueriesProvider,
  ProjectTableQueriesProviderProps,
} from '@shared/containers/ProjectTreeTable/context/ProjectTableQueriesContext'
import { useLazyGetTasksByParentQuery } from '@queries/overview/getOverview'
import { useUsersPageConfig } from './hooks/useUserPageConfig'

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
  const [pageConfig, updatePageConfig] = useUsersPageConfig({
    page: 'overview',
    projectName: props.projectName,
  })

  const [entityOperations] = useUpdateOverviewEntitiesMutation()

  const updateEntities: ProjectTableQueriesProviderProps['updateEntities'] = async ({
    operations,
    patchOperations,
  }) => {
    return await entityOperations({
      operationsRequestModel: { operations },
      patchOperations,
      projectName: props.projectName,
    }).unwrap()
  }
  const [fetchFolderTasks] = useLazyGetTasksByParentQuery()
  const getFoldersTasks: ProjectTableQueriesProviderProps['getFoldersTasks'] = async (
    args,
    force,
  ) => {
    return await fetchFolderTasks(
      {
        projectName: props.projectName,
        ...args,
      },
      force,
    ).unwrap()
  }

  return (
    <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
      <ProjectTableProvider
        {...props}
        contextMenuItems={[
          'copy-paste',
          'show-details',
          'expand-collapse',
          'inherit',
          'export',
          'create-folder',
          'create-task',
          'delete',
        ]}
      >
        <NewEntityProvider>
          <SelectionProvider>
            <SelectedRowsProvider>
              <ColumnSettingsProvider config={pageConfig} onChange={updatePageConfig}>
                <CellEditingProvider>
                  <ProjectOverviewPage />
                </CellEditingProvider>
              </ColumnSettingsProvider>
            </SelectedRowsProvider>
          </SelectionProvider>
        </NewEntityProvider>
      </ProjectTableProvider>
    </ProjectTableQueriesProvider>
  )
}

export default ProjectOverviewWithProviders
