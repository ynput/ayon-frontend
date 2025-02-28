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
import useFetchAndUpdateEntityData from './hooks/useFetchEditorEntities'
import useUpdateEditorEntities from './hooks/useUpdateEditorEntities'
import useAttributeFields from './hooks/useAttributesList'
import useFilteredEntities from './hooks/useFilteredEntities'
import useTableTree from './hooks/useTableTree'
import FlexTable from './FlexTable'
import { useState } from 'react'
import { useGetProjectQuery } from '@queries/project/getProject'
import { useAppSelector } from '@state/store'

type Props = {
  filters: Filter[]
  showHierarchy: boolean
  sortBy: SortByOption[]
}

const NewEditorPage = ({ filters, showHierarchy, sortBy }: Props) => {
  const projectName = useAppSelector((state) => state.project.name) as unknown as string
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const { data: { statuses, folderTypes, taskTypes } = {} } = useGetProjectQuery(
    { projectName },
    { skip: !projectName },
  )

  const { rowSelection } = useSlicerContext()
  const { attribFields } = useAttributeFields()
  const { filter: sliceFilter } = useFilterBySlice()

  const { updateEntities } = useUpdateEditorEntities({ projectName, filters, sliceFilter })
  const [expanded, updateExpanded] = useState({})

  console.time('dataToTable')
  // 28.3 ms -> 6ms

  // console.time('useFetchAndUpdateEntityData')
  // 1.4ms
  const { foldersMap, tasksMap, tasksByFolderMap } = useFetchAndUpdateEntityData({
    projectName,
    selectedFolders: Object.keys(rowSelection),
    filters,
    sliceFilter,
    expanded,
  })
  // console.timeEnd('useFetchAndUpdateEntityData')

  // console.time('getFilteredEntities')
  // 8.1ms down to 1.6ms
  // const {
  //   folders: filteredFolders,
  //   tasks: filteredTasks,
  //   taskList,
  // } = useFilteredEntities({
  //   folders: foldersMap,
  //   tasksMap,
  //   filters,
  //   // sliceFilter,
  //   // // sortBy,
  // })
  // console.timeEnd('getFilteredEntities')

  // console.time('populateTableData')
  // Use the memoized hook instead of direct function call
  const tableData = useTableTree({
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    expanded,
    folderTypes,
    taskTypes,
  })
  // console.timeEnd('populateTableData')

  console.timeEnd('dataToTable')

  console.log(tableData.length && tableData[0])

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
                tableData={tableData}
                users={users}
                statuses={statuses}
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
