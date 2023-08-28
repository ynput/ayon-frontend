import {
  EntityCard,
  InputText,
  Panel,
  Section,
  SortingDropdown,
  Toolbar,
} from '@ynput/ayon-react-components'
import React, { Fragment, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  onTaskSelected,
  onTasksFilterChanged,
  onTasksGroupByChanged,
  onTasksSortByChanged,
} from '/src/features/dashboard'
import { getFilteredTasks, getGroupedTasks, getSortedTasks, getTasksColumns } from '../util'

const UserDashboardKanBan = ({ tasks }) => {
  const dispatch = useDispatch()

  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)

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
  // SELECTED TASKS
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const setSelectedTasks = (tasks) => dispatch(onTaskSelected(tasks))

  // filter out projects by selected projects and filter value
  const filteredTasks = useMemo(
    () => getFilteredTasks(tasks, filterValue, selectedProjects),
    [tasks, filterValue, selectedProjects],
  )

  // sort tasks by sort by values
  const sortedTasks = useMemo(
    () => getSortedTasks(filteredTasks, sortByValue),
    [filteredTasks, sortByValue],
  )

  // arrange the tasks into columns by status
  const columnIds = [
    'Not ready',
    'Ready to start',
    'in Progress',
    'Pending review',
    'Approved',
    'On hold',
    'Omitted',
  ]
  const tasksColumns = useMemo(
    () => getTasksColumns(sortedTasks, 'status', columnIds),
    [sortedTasks],
  )

  // HANDLE TASK CLICK
  const handleTaskClick = (e, id) => {
    e.preventDefault()
    e.stopPropagation()

    const { metaKey, ctrlKey, shiftKey } = e
    const ctrlOrMeta = metaKey || ctrlKey
    const shift = shiftKey && !ctrlOrMeta

    let newSelection = []

    // metaKey or ctrlKey or shiftKey is pressed, add to selection instead of replacing
    if (ctrlOrMeta || shift) {
      newSelection = [...selectedTasks]
    }

    // add (selected) to selection
    if (!newSelection.includes(id)) {
      // add to selection
      newSelection.push(id)
    } else if (ctrlOrMeta) {
      // remove from selection
      newSelection = newSelection.filter((taskId) => taskId !== id)
    }

    setSelectedTasks(newSelection)
    // updates the breadcrumbs
    // let uri = `ayon+entity://${projectName}/`
    // uri += `${event.node.data.parents.join('/')}/${event.node.data.folder}`
    // uri += `?product=${event.node.data.name}`
    // uri += `&version=${event.node.data.versionName}`
    // dispatch(setUri(uri))
  }

  return (
    <Section style={{ height: '100%', zIndex: 10 }}>
      <Toolbar style={{ zIndex: 20 }}>
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
      </Toolbar>
      <Section
        style={{
          height: '100%',
          width: '100%',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
        }}
        direction="row"
      >
        {columnIds.flatMap((id) =>
          tasksColumns[id] ? (
            <Panel key={id}>
              <h2 style={{ whiteSpace: 'nowrap' }}>{id}</h2>
              {getGroupedTasks(tasksColumns[id], groupByOptions[0]).map((group) => (
                <Fragment key={group.label}>
                  <span>{group.label}</span>
                  {group.tasks.map((task) => (
                    <EntityCard
                      key={task.id}
                      title={task.name}
                      subTitle={task.folderName}
                      description={task.path}
                      onClick={(e) => handleTaskClick(e, task.id)}
                      isActive={selectedTasks.includes(task.id)}
                      style={{ width: 210 }}
                    />
                  ))}
                </Fragment>
              ))}
            </Panel>
          ) : (
            []
          ),
        )}
      </Section>
    </Section>
  )
}

export default UserDashboardKanBan
