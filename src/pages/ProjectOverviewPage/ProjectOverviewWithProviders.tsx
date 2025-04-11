import { FC } from 'react'
import ProjectOverviewPage from './ProjectOverviewPage'
import {
  ProjectTableProvider,
  SelectionProvider,
  SelectedRowsProvider,
  ColumnSettingsProvider,
} from '@shared/ProjectTreeTable'
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
} from '@shared/ProjectTreeTable/context/ProjectTableQueriesContext'
import { useLazyGetTasksByParentQuery } from '@queries/overview/getOverview'

const ProjectOverviewWithProviders: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''
  return (
    <ProjectDataProvider projectName={projectName}>
      <ProjectOverviewProvider>
        <SettingsPanelProvider>
          <ProjectOverWithTableProviders />
        </SettingsPanelProvider>
      </ProjectOverviewProvider>
    </ProjectDataProvider>
  )
}

const ProjectOverWithTableProviders: FC = () => {
  const props = useProjectOverviewContext()
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
      <ProjectTableProvider {...props}>
        <NewEntityProvider>
          <SelectionProvider>
            <SelectedRowsProvider>
              <ColumnSettingsProvider projectName={props.projectName}>
                <ProjectOverviewPage />
              </ColumnSettingsProvider>
            </SelectedRowsProvider>
          </SelectionProvider>
        </NewEntityProvider>
      </ProjectTableProvider>
    </ProjectTableQueriesProvider>
  )
}

export default ProjectOverviewWithProviders
