import { InputText, Section, SortingDropdown, Toolbar } from '@ynput/ayon-react-components'
import React, { Fragment, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  onTaskSelected,
  onTasksFilterChanged,
  onTasksGroupByChanged,
  onTasksSortByChanged,
} from '/src/features/dashboard'
import {
  getFilteredTasks,
  getGroupedTasks,
  getMergedStatuses,
  getSortedTasks,
  getTasksColumns,
} from '../util'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import KanBanColumn from './KanBanColumn/KanBanColumn'
import KanBanCard from './KanBanCard/KanBanCard'
import { useUpdateTaskMutation } from '/src/services/userDashboard/updateUserDashboard'

const UserDashboardKanBan = ({ tasks, projectsInfo = {}, assignees = [] }) => {
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
  const mergedStatuses = getMergedStatuses(projectsInfo)

  const splitBy = 'status'
  const tasksColumns = useMemo(
    () => getTasksColumns(sortedTasks, splitBy, mergedStatuses),
    [sortedTasks],
  )

  const touchSensor = useSensor(TouchSensor)
  const keyboardSensor = useSensor(KeyboardSensor)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    touchSensor,
    keyboardSensor,
  )

  // UPDATE TASK MUTATION
  const [updateTask] = useUpdateTaskMutation()

  const handleDragEnd = async (event) => {
    // get over id
    const { active, over } = event
    // if different id, move card
    const activeCardId = active.id?.toString()
    const overColumnId = over?.id?.toString()
    if (!activeCardId || !overColumnId) return
    // find the column id of the card
    const activeColumn = Object.values(tasksColumns).find((column) =>
      column.tasks.find((t) => t.id === activeCardId),
    )
    const overColumn = tasksColumns[overColumnId]
    const activeColumnId = activeColumn?.id
    if (!activeColumnId || !overColumn) return
    // if same column, do nothing
    if (activeColumnId === overColumnId) return
    // find the task
    const task = tasks.find((t) => t.id === activeCardId)
    if (!task) return
    // card has moved columns, update the task
    const newTaskData = { [splitBy]: overColumn.name }
    await updateTask({
      projectName: task.projectName,
      taskId: task.id,
      data: newTaskData,
      assignees,
    })
  }

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
    <Section style={{ height: '100%', zIndex: 10, padding: 0 }} wrap>
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
          overflowX: 'auto',
        }}
        direction="row"
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {mergedStatuses.flatMap(({ id }) => {
            const column = tasksColumns[id]
            if (!column) return []

            return (
              <KanBanColumn key={id} columns={tasksColumns} tasks={column.tasks} id={id}>
                {getGroupedTasks(column.tasks, groupByOptions[0]).map((group) => (
                  <Fragment key={group.label}>
                    <span>{group.label}</span>
                    {group.tasks.map((task) => (
                      <KanBanCard
                        task={task}
                        key={task.id}
                        onClick={(e) => handleTaskClick(e, task.id)}
                        isActive={selectedTasks.includes(task.id)}
                      />
                    ))}
                  </Fragment>
                ))}
              </KanBanColumn>
            )
          })}
        </DndContext>
      </Section>
    </Section>
  )
}

export default UserDashboardKanBan
