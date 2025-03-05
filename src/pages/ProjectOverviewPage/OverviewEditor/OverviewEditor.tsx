import { useMemo, useState } from 'react'

// UI components
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'

// Types
import { Filter } from '@components/SearchFilter/types'
import { SortByOption } from '@pages/UserDashboardPage/UserDashboardTasks/DashboardTasksToolbar/KanBanSortByOptions'
import { BuiltInFieldOptions } from './TableColumns'

// Contexts
import { useSlicerContext } from '@context/slicerContext'

// Queries
import { useGetProjectQuery } from '@queries/project/getProject'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'

// Redux
import { useAppSelector } from '@state/store'

// Custom hooks
import useAttributeFields from './hooks/useAttributesList'
import useFetchAndUpdateEntityData from './hooks/useFetchEditorEntities'
import useFilteredEntities from './hooks/useFilteredEntities'
import useTableTree from './hooks/useTableTree'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'

// Components
import FlexTable from './FlexTable'
import { SortingState } from '@tanstack/react-table'

type User = {
  name: string
  attrib: {
    fullName: string
  }
}

type Props = {
  filters: Filter[]
  showHierarchy: boolean
}

const OverviewEditor = ({ filters, showHierarchy }: Props) => {
  const projectName = useAppSelector((state) => state.project.name) as unknown as string
  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]

  const { data: { statuses = [], folderTypes = [], taskTypes = [] } = {} } = useGetProjectQuery(
    { projectName },
    { skip: !projectName },
  )

  const { rowSelection } = useSlicerContext()
  const { attribFields } = useAttributeFields()
  const { filter: sliceFilter } = useFilterBySlice()

  const [expanded, updateExpanded] = useState({})
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'name',
      desc: true,
    },
  ])

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

  // for folderTypes, taskTypes, statuses and assignees, create options object
  const options: BuiltInFieldOptions = useMemo(
    () => ({
      assignees: users.map(({ name, attrib }) => ({
        value: name,
        label: attrib?.fullName || name,
        icon: `/api/users/${name}/avatar`,
      })),
      statuses: statuses.map(({ name, color, icon }) => ({
        value: name,
        label: name,
        color,
        icon,
      })),
      folderTypes: folderTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
      taskTypes: taskTypes.map(({ name, icon }) => ({ value: name, label: name, icon })),
    }),
    [users, statuses, folderTypes, taskTypes],
  )

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
                options={options}
                isLoading={false}
                isExpandable={false}
                sliceId={''}
                // expanded folders
                expanded={expanded}
                updateExpanded={updateExpanded}
                // sorting
                sorting={sorting}
                updateSorting={setSorting}
                // metadata
                tasksMap={tasksMap}
                foldersMap={foldersMap}
              />
            </TablePanel>
          </SplitterPanel>
        </Splitter>
      </Section>
    </main>
  )
}

export default OverviewEditor
