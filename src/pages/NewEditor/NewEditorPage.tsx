import { useSelector } from 'react-redux'

import { Section, TablePanel } from '@ynput/ayon-react-components'

import { Splitter, SplitterPanel } from 'primereact/splitter'

import { Filter } from '@components/SearchFilter/types'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'
import { useSlicerContext } from '@context/slicerContext'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { $Any } from '@types'

import { SortByOption } from '@pages/UserDashboardPage/UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'
import getAllProjectStatuses from '@containers/DetailsPanel/helpers/getAllProjectsStatuses'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import useFetchAndUpdateEntityData from './hooks/useFetchEditorEntities'
import { getFilteredEntities } from './helpers/filters'
import useUpdateEditorEntities from './hooks/useUpdateEditorEntities'
import useAttributeFields from './hooks/useAttributesList'
import { populateTableData } from './mappers/mappers'
import { FolderNodeMap, TaskNodeMap } from './types'
import entityToRowMappers from './mappers/entityToRowMappers'
import FlexTable from './FlexTable'
import { useState } from 'react'

type Props = {
  filters: Filter[]
  showHierarchy: boolean
  sortBy: SortByOption[]
}

const NewEditorPage = ({ filters, showHierarchy, sortBy }: Props) => {
  const project = useSelector((state: $Any) => state.project)
  const projectName = useSelector((state: $Any) => state.project.name)
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })
  const projectInfo = projectsInfo[projectName] || {}
  const allStatuses = getAllProjectStatuses({ [projectName]: projectInfo })

  const { rowSelection } = useSlicerContext()
  const { attribFields } = useAttributeFields()
  const { filter: sliceFilter } = useFilterBySlice()

  const { updateEntities } = useUpdateEditorEntities({ projectName, filters, sliceFilter })
  const [expanded, updateExpanded] = useState({})

  console.time('dataToTable')
  // 28.3 ms

  console.time('useFetchAndUpdateEntityData')
  // 1.4ms
  const {
    rawData: allFolders,
    folders,
    tasks,
    tasksFolders,
  } = useFetchAndUpdateEntityData({
    projectName,
    folderTypes: project.folders || {},
    taskTypes: project.tasks || {},
    selectedFolders: Object.keys(rowSelection),
    filters,
    sliceFilter,
    expanded,
  })
  console.timeEnd('useFetchAndUpdateEntityData')

  console.time('getFilteredEntities')
  // 8.1ms
  const {
    folders: filteredFolders,
    tasks: filteredTasks,
    taskList,
  } = getFilteredEntities({
    folders,
    tasks: tasks as TaskNodeMap,
    tasksFolders,
    filters,
    sliceFilter,
    // sortBy,
  })
  console.timeEnd('getFilteredEntities')

  console.time('populateTableData')
  // 18ms
  const { tableData } = populateTableData({
    allFolders,
    folders: filteredFolders as FolderNodeMap,
    tasks: filteredTasks,
    taskList,
    tasksFolders,
    isFlatList: !showHierarchy,
    entityToRowMappers: entityToRowMappers(project.folders, project.tasks),
    expanded,
  })

  console.log(expanded)

  console.timeEnd('populateTableData')

  console.timeEnd('dataToTable')

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
              <FlexTable
                attribs={attribFields}
                // TODO fetch & pass attrib data using new graphql queries
                rawData={{ folders, tasks }}
                tableData={tableData}
                users={users}
                statuses={allStatuses}
                updateEntities={updateEntities}
                isLoading={false}
                isExpandable={false}
                sliceId={''}
                expanded={expanded}
                updateExpanded={updateExpanded}
              />
            </TablePanel>
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default NewEditorPage
