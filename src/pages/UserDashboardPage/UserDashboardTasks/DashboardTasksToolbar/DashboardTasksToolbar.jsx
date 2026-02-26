import { Button, InputText, SortingDropdown, Spacer } from '@ynput/ayon-react-components'
import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  onAssigneesChanged,
  onTasksFilterChanged,
  onTasksGroupByChanged,
  onTasksSortByChanged,
} from '@state/dashboard'
import MeOrUserSwitch from '@components/MeOrUserSwitch/MeOrUserSwitch'
import * as Styled from './DashboardTasksToolbar.styled'
import sortByOptions from './KanBanSortByOptions'
import { getGroupByOptions } from './KanBanGroupByOptions'
import useUserProjectPermissions from '@hooks/useUserProjectPermissions'
import { parseProjectFolderRowId } from '@containers/ProjectsList/buildProjectsTableData'

const DashboardTasksToolbar = ({ isLoading, view, setView, projectUsers = [] }) => {
  const dispatch = useDispatch()

  // ASSIGNEES SELECT
  const assignees = useSelector((state) => state.dashboard.tasks.assignees)
  const assigneesFilter = useSelector((state) => state.dashboard.tasks.assigneesFilter)

  const setAssignees = (payload) => dispatch(onAssigneesChanged(payload))

  // CHECK READ RESTRICTIONS
  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)
  const selectedProjectNames = useMemo(
    () => selectedProjects.filter((id) => !parseProjectFolderRowId(id)),
    [selectedProjects],
  )
  const isUser = useSelector((state) => state.user.data.isUser)
  const { permissions } = useUserProjectPermissions(isUser)

  const canViewOtherUsers = useMemo(() => {
    if (!permissions) return false
    if (permissions.hasElevatedPrivileges) return true
    

    // every selected project must have read restrictions disabled (read.enabled !== true)
    return selectedProjectNames.every((projectName) => {
      const projectPerm = permissions.permissions?.projects[projectName]
      return !projectPerm?.read?.enabled
    })
  }, [permissions, selectedProjectNames])

  // auto-reset to 'me' when user loses access to other users
  useEffect(() => {
    if (!canViewOtherUsers && assigneesFilter !== 'me') {
      setAssignees({ filter: 'me', assignees: [] })
    }
  }, [canViewOtherUsers])

  const sortByValue = useSelector((state) => state.dashboard.tasks.sortBy)
  const setSortByValue = (value) => dispatch(onTasksSortByChanged(value))

  // GROUP BY
  const groupByOptions = getGroupByOptions(assigneesFilter !== 'me')

  const groupByValue = useSelector((state) => state.dashboard.tasks.groupBy)

  const setGroupByValue = (value) => dispatch(onTasksGroupByChanged(value))

  const handleGroupBy = (value) => {
    const option = groupByOptions.find((o) => o.id === value?.id)
    if (!option) return setGroupByValue([])
    const optionValue = { ...option, sortOrder: value.sortOrder }

    // update state
    setGroupByValue([optionValue])
  }

  // FILTER
  const filterValue = useSelector((state) => state.dashboard.tasks.filter)
  const setFilterValue = (value) => dispatch(onTasksFilterChanged(value))

  const handleAssigneesChange = (filter, newAssignees) => {
    const payload = {
      filter: filter, // me, all, users
      assignees: newAssignees || assignees,
    }

    // update state
    setAssignees(payload)
  }

  return (
    <Styled.TasksToolbar>
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
        onChange={(v) => handleGroupBy(v[0])}
        multiSelect={false}
      />
      <InputText
        placeholder="Filter tasks..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
      />
      {!isLoading && (
        <MeOrUserSwitch
          value={assignees}
          onChange={(state, v) => handleAssigneesChange(state, v)}
          filter={assigneesFilter}
          users={projectUsers}
          canViewOtherUsers={canViewOtherUsers}
          align={'right'}
          placeholder="Assignees"
          buttonStyle={{ outline: '1px solid var(--md-sys-color-outline-variant)' }}
          style={{ zIndex: 20 }}
        />
      )}
      <Spacer />
      <Button
        label="List"
        onClick={() => setView('list')}
        selected={view === 'list'}
        icon="format_list_bulleted"
        data-tooltip="List view"
      />
      <Button
        label="Board"
        onClick={() => setView('kanban')}
        selected={view === 'kanban'}
        icon="view_kanban"
        data-tooltip="Board (kanban) view"
      />
    </Styled.TasksToolbar>
  )
}

export default DashboardTasksToolbar
