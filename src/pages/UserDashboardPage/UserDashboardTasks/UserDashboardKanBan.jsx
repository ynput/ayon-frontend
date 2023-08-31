import {
  AssigneeSelect,
  InputText,
  Section,
  SortingDropdown,
  Spacer,
  Toolbar,
} from '@ynput/ayon-react-components'
import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  onAssigneesChanged,
  onTasksFilterChanged,
  onTasksGroupByChanged,
  onTasksSortByChanged,
} from '/src/features/dashboard'
import { getFilteredTasks, getMergedFields, getSortedTasks, getTasksColumns } from '../util'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useUpdateTaskMutation } from '/src/services/userDashboard/updateUserDashboard'
import { toast } from 'react-toastify'
import { useGetKanBanUsersQuery } from '/src/services/userDashboard/getUserDashboard'
import KanBanCard from './KanBanCard/KanBanCard'
import ColumnsWrapper from './TasksWrapper'

const UserDashboardKanBan = ({ tasks, projectsInfo = {}, assignees = [], taskFields }) => {
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

  // This is the key that divides the tasks into columns
  // default is hardcoded to "status" but maybe in the future we can make this dynamic
  // the key also needs to be in the taskFields object
  const splitBy = 'status'
  const splitByField = taskFields[splitBy]
  const splitByPlural = splitByField.plural
  // arrange the tasks into columns by status
  const mergedFields = getMergedFields(projectsInfo, splitByPlural)

  const [tasksColumns, fieldsColumns] = useMemo(
    () => getTasksColumns(sortedTasks, splitBy, mergedFields),
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

  // keep track of which card is being dragged
  const [activeDraggingId, setActiveDraggingId] = useState(null)

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeDraggingId),
    [activeDraggingId, tasks],
  )

  const handleDragStart = (event) => {
    setActiveDraggingId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    setActiveDraggingId(null)
    // first check if field can be edited on task
    if (splitByField.isEditable === false)
      return toast.error(`Cannot edit ${splitByField.plural} on task`)

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

    // if the editing field is taskType and the task name is the same as the taskType, change name to new taskType
    if (splitBy === 'taskType' && task.name.toLowerCase() === task.taskType.toLowerCase()) {
      newTaskData.name = overColumn.name
    }

    await updateTask({
      projectName: task.projectName,
      taskId: task.id,
      data: newTaskData,
      assignees,
    })
  }

  return (
    <Section style={{ height: '100%', zIndex: 10, padding: 0, overflow: 'hidden' }}>
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

      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        autoScroll={false}
      >
        <ColumnsWrapper
          fieldsColumns={fieldsColumns}
          tasksColumns={tasksColumns}
          groupByValue={groupByValue}
        />
        <DragOverlay dropAnimation={null}>
          {activeDraggingId && activeTask && <KanBanCard task={activeTask} isOverlay />}
        </DragOverlay>
      </DndContext>
    </Section>
  )
}

export default UserDashboardKanBan
