import {
  AssigneeSelect,
  InputText,
  SortingDropdown,
  Spacer,
  Toolbar,
} from '@ynput/ayon-react-components'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  onAssigneesChanged,
  onTasksFilterChanged,
  onTasksGroupByChanged,
  onTasksSortByChanged,
} from '/src/features/dashboard'
import { useGetKanBanUsersQuery } from '/src/services/userDashboard/getUserDashboard'

const DashboardTasksToolbar = ({ assignees = [] }) => {
  const dispatch = useDispatch()

  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)

  const user = useSelector((state) => state.user)
  const isAdmin = user?.data?.isAdmin

  // SORT BY
  const sortByOptions = [
    { id: 'folderName', label: 'Shot', sortOrder: true },
    { id: 'name', label: 'Task', sortOrder: true },
    { id: 'status', label: 'Status', sortORder: true },
  ]
  const sortByValue = useSelector((state) => state.dashboard.tasks.sortBy)
  const setSortByValue = (value) => dispatch(onTasksSortByChanged(value))

  // GROUP BY
  const groupByOptions = [
    { id: 'projectName', label: 'Project', sortOrder: true },
    // { id: 'status', label: 'Status', sortOrder: true },
  ]
  const groupByValue = useSelector((state) => state.dashboard.tasks.groupBy)
  const setGroupByValue = (value) => dispatch(onTasksGroupByChanged(value))

  // FILTER
  const filterValue = useSelector((state) => state.dashboard.tasks.filter)
  const setFilterValue = (value) => dispatch(onTasksFilterChanged(value))
  // ASSIGNEES SELECT
  const { data: allUsers = [], isLoading: isLoadingAllUsers } = useGetKanBanUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  const setAssignees = (assignees) => dispatch(onAssigneesChanged(assignees))
  return (
    <Toolbar style={{ zIndex: 100, padding: '1px 8px' }}>
      <SortingDropdown
        title="Sort by"
        options={sortByOptions}
        value={sortByValue}
        onChange={setSortByValue}
      />
      <SortingDropdown
        title="Group by"
        options={groupByOptions}
        value={groupByValue}
        onChange={setGroupByValue}
      />
      <InputText
        placeholder="Filter tasks..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
      />
      <Spacer />
      {isAdmin && !isLoadingAllUsers && (
        <AssigneeSelect
          value={assignees}
          onChange={setAssignees}
          options={allUsers}
          align={'right'}
          minSelected={1}
          editor
          buttonStyle={{ outline: '1px solid var(--md-sys-color-outline-variant)' }}
          style={{ zIndex: 20 }}
        />
      )}
    </Toolbar>
  )
}

export default DashboardTasksToolbar
