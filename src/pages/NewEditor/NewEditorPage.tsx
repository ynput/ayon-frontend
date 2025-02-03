import { useSelector } from 'react-redux'

import { Section, TablePanel } from '@ynput/ayon-react-components'

import { Splitter, SplitterPanel } from 'primereact/splitter'

import { Filter } from '@components/SearchFilter/types'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useSlicerContext } from '@context/slicerContext'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { $Any } from '@types'

import useFetchAndUpdateEntityData from './hooks/useFetchEditorEntities'
import useAttributeFields from './hooks/useAttributesList'
import { handleToggleFolder } from './handlers'
import { getFilteredEntities, populateTableData } from './mappers'
import MyTable from './Table'
import { SortByOption } from '@pages/UserDashboardPage/UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'

type Props = {
  filters: Filter[]
  showHierarchy: boolean
  sortBy: SortByOption[]
}

const NewEditorPage = ({ filters, showHierarchy, sortBy }: Props) => {
  const project = useSelector((state: $Any) => state.project)
  const projectName = useSelector((state: $Any) => state.project.name)
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const { rowSelection } = useSlicerContext()
  const { attribFields } = useAttributeFields()
  const { filter: sliceFilter } = useFilterBySlice()

  const {
    rawData: allFolders,
    folders,
    tasks,
    setExpandedItem,
    expanded,
    setExpanded,
    updateEntities,
  } = useFetchAndUpdateEntityData({
    projectName,
    folderTypes: project.folders || {},
    taskTypes: project.tasks || {},
    selectedFolders: Object.keys(rowSelection),
    filters,
    sliceFilter,
  })

  const {
    folders: filteredFolders,
    tasks: filteredTasks,
    taskList,
  } = getFilteredEntities({
    allFolders,
    folders,
    tasks,
    filters,
    sliceFilter,
    sortBy,
  })

  const { tableData } = populateTableData({
    allFolders,
    folders: filteredFolders,
    tasks: filteredTasks,
    taskList,
    folderTypes: project.folders,
    taskTypes: project.tasks,
    isFlatList: !showHierarchy,
  })

  // TODO Figure out why tree is incomplete. i.e. project_a and select lib and attempt to expand sq
  const toggleHandler = handleToggleFolder(setExpandedItem)

  return (
    <main className="editor-page" style={{ height: '100%' }}>
      <Section style={{ height: '100%' }}>
        <Splitter
          style={{ width: '100%', height: '100%' }}
          layout="horizontal"
          stateKey="editor-panels"
          stateStorage="local"
        >
          <SplitterPanel size={100}>
            <TablePanel style={{ height: '100%' }}>
              <MyTable
                attribs={attribFields}
                // TODO fetch & pass attrib data using new graphql queries
                rawData={{ folders, tasks }}
                tableData={tableData}
                users={users}
                expanded={expanded}
                setExpanded={setExpanded}
                toggleExpanderHandler={toggleHandler}
                updateEntities={updateEntities}
                isLoading={false}
                isExpandable={false}
                sliceId={''}
              />
            </TablePanel>
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default NewEditorPage
