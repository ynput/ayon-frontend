import { useListItemsDataContext } from '@pages/ProjectListsPage/context/ListItemsDataContext'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { SettingsPanelProvider } from '@pages/ProjectOverviewPage/context/SettingsPanelContext'
import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import { useUsersPageConfig } from '@pages/ProjectOverviewPage/hooks/useUserPageConfig'
import { EmptyPlaceholder } from '@shared/components'
import {
  CellEditingProvider,
  ColumnSettingsProvider,
  ProjectTableProvider,
  ProjectTableQueriesProvider,
  ProjectTreeTable,
  SelectedRowsProvider,
  SelectionProvider,
} from '@shared/containers/ProjectTreeTable'
import { FC } from 'react'

interface ListItemsTableProps {}

const ListItemsTable: FC<ListItemsTableProps> = ({}) => {
  const { rowSelection } = useListsContext()
  const selectedListsIds = Object.entries(rowSelection).filter(([_, isSelected]) => isSelected)
  const isMultipleSelected = selectedListsIds.length > 1
  const { isError, projectName } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  if (!selectedListsIds.length) return <EmptyPlaceholder message="Start by selecting a list." />

  if (isMultipleSelected)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError) return <EmptyPlaceholder message="Error loading list items." />

  return (
    <ProjectTreeTable
      scope={scope}
      sliceId={''}
      // pagination
      fetchMoreOnBottomReached={() => {
        console.log('REACHED BOTTOM: Doing nothing...')
      }}
    />
  )
}

const ListItemsTableWithProviders: FC<ListItemsTableProps> = () => {
  const { projectName, ...props } = useListItemsDataContext()

  const [pageConfig, updatePageConfig] = useUsersPageConfig({
    page: 'lists',
    projectName: projectName,
  })

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: projectName,
  })

  return (
    <SettingsPanelProvider>
      <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
        <ProjectTableProvider
          projectName={projectName}
          attribFields={props.attribFields}
          projectInfo={props.projectInfo}
          users={props.users}
          entitiesMap={props.listItemsMap}
          foldersMap={props.foldersMap}
          tasksMap={props.tasksMap}
          tableRows={props.listItemsTableData}
          expanded={{}}
          isInitialized={true}
          showHierarchy={false}
        >
          <SelectionProvider>
            <SelectedRowsProvider>
              <ColumnSettingsProvider config={pageConfig} onChange={updatePageConfig}>
                <CellEditingProvider>
                  <ListItemsTable />
                </CellEditingProvider>
              </ColumnSettingsProvider>
            </SelectedRowsProvider>
          </SelectionProvider>
        </ProjectTableProvider>
      </ProjectTableQueriesProvider>
    </SettingsPanelProvider>
  )
}

export default ListItemsTableWithProviders
