import { useCallback, useMemo, useState } from 'react'

// UI components
import { Section, TablePanel } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'

// Types
import { Filter } from '@components/SearchFilter/types'
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
import useOverviewTable from './hooks/useOverviewTable'
import useFilterBySlice from '@containers/TasksProgress/hooks/useFilterBySlice'

// Components
import FlexTable from './FlexTable'
import { ExpandedState, functionalUpdate, OnChangeFn, SortingState } from '@tanstack/react-table'
import useLocalStorage from '@hooks/useLocalStorage'

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

  const [expanded, setExpanded] = useLocalStorage<ExpandedState>(
    `overview-expanded-${projectName}`,
    {},
  )
  const updateExpanded: OnChangeFn<ExpandedState> = (expandedUpdater) => {
    setExpanded(functionalUpdate(expandedUpdater, expanded))
  }

  const [sorting, setSorting] = useLocalStorage<SortingState>(`overview-sorting-${projectName}`, [
    {
      id: 'name',
      desc: true,
    },
  ])

  const updateSorting: OnChangeFn<SortingState> = (sortingUpdater) => {
    setSorting(functionalUpdate(sortingUpdater, sorting))
  }

  console.time('dataToTable')
  // 28.3 ms -> 6ms

  // console.time('useFetchAndUpdateEntityData')
  // 1.4ms
  const { foldersMap, tasksMap, tasksByFolderMap, fetchNextPage, isLoading } =
    useFetchAndUpdateEntityData({
      projectName,
      selectedFolders: Object.keys(rowSelection),
      filters,
      sliceFilter,
      expanded,
      showHierarchy,
    })
  // console.timeEnd('useFetchAndUpdateEntityData')

  //called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement && !showHierarchy) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement
        //once the user has scrolled within 1000px of the bottom of the table, fetch more data if we can
        if (scrollHeight - scrollTop - clientHeight < 1000 && !isLoading) {
          fetchNextPage()
        }
      }
    },
    [fetchNextPage, isLoading, showHierarchy],
  )

  // console.time('populateTableData')
  // Use the memoized hook instead of direct function call
  const tableData = useOverviewTable({
    foldersMap,
    tasksMap,
    tasksByFolderMap,
    expanded,
    folderTypes,
    taskTypes,
    showHierarchy,
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
                updateSorting={updateSorting}
                // pagination
                fetchMoreOnBottomReached={fetchMoreOnBottomReached}
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
