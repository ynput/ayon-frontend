import { useCallback, useMemo } from 'react'

// UI components
import { Section } from '@ynput/ayon-react-components'

// Types
import { Filter } from '@components/SearchFilter/types'
import { BuiltInFieldOptions } from '../../../containers/ProjectTreeTable/ProjectTreeTableColumns'

// Queries
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { ProjectModel } from '@api/rest/project'

// Custom hooks
import useAttributeFields from '../hooks/useAttributesList'
import useFetchAndUpdateEntityData from '../hooks/useFetchEditorEntities'
import useOverviewTable from '../hooks/useOverviewTable'

// Components
import ProjectTreeTable from '../../../containers/ProjectTreeTable/ProjectTreeTable'
import { ExpandedState, functionalUpdate, OnChangeFn, SortingState } from '@tanstack/react-table'
import useLocalStorage from '@hooks/useLocalStorage'

type User = {
  name: string
  attrib: {
    fullName: string
  }
}

type Props = {
  selectedFolders: string[] // folders selected in the slicer (hierarchy)
  filters: Filter[] // filters from the filters bar or slicer (not hierarchy)
  showHierarchy: boolean
  projectName: string
  projectInfo?: ProjectModel
}

const ProjectOverviewTable = ({
  filters,
  showHierarchy,
  selectedFolders,
  projectName,
  projectInfo,
}: Props) => {
  const scope = `overview-${projectName}`
  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]

  const { statuses = [], folderTypes = [], taskTypes = [] } = projectInfo || {}

  const { attribFields } = useAttributeFields()

  const [expanded, setExpanded] = useLocalStorage<ExpandedState>(`expanded-${scope}`, {})
  const updateExpanded: OnChangeFn<ExpandedState> = (expandedUpdater) => {
    setExpanded(functionalUpdate(expandedUpdater, expanded))
  }

  const [sorting, setSorting] = useLocalStorage<SortingState>(`sorting-${scope}`, [
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
      selectedFolders,
      filters,
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
    <Section style={{ height: '100%' }}>
      <ProjectTreeTable
        scope={scope}
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
    </Section>
  )
}

export default ProjectOverviewTable
