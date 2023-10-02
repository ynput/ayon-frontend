import { Section } from '@ynput/ayon-react-components'
import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getFilteredTasks, getMergedFields, getSortedTasks, getTasksColumns } from '../util'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useUpdateTasksMutation } from '/src/services/userDashboard/updateUserDashboard'
import { toast } from 'react-toastify'

import ColumnsWrapper from './ColumnsWrapper'
import DashboardTasksToolbar from './DashboardTasksToolbar/DashboardTasksToolbar'
import { useGetKanBanUsersQuery } from '/src/services/userDashboard/getUserDashboard'
import { onCollapsedColumnsChanged, onTaskSelected } from '/src/features/dashboard'
import KanBanCardOverlay from './KanBanCard/KanBanCardOverlay'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import UserDashboardList from './UserDashboardList/UserDashboardList'

const UserDashboardKanBan = ({
  tasks,
  projectsInfo = {},
  taskFields,
  isLoading,
  statusesOptions,
  disabledStatuses,
  disabledProjectUsers = [],
}) => {
  const dispatch = useDispatch()

  // KANBAN or TASKS
  const [view, setView] = useQueryParam('view', withDefault(StringParam, 'kanban'))

  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const setSelectedTasks = (tasks) => dispatch(onTaskSelected(tasks))

  const selectedProjects = useSelector((state) => state.dashboard.selectedProjects)

  // COLLAPSED COLUMNS
  const collapsedColumns = useSelector((state) => state.dashboard.tasks.collapsedColumns)
  const setCollapsedColumns = (ids) => dispatch(onCollapsedColumnsChanged(ids))

  // handle collapse toggle
  const handleCollapseToggle = (id) => {
    const newCollapsedColumns = collapsedColumns.includes(id)
      ? collapsedColumns.filter((groupId) => groupId !== id)
      : [...collapsedColumns, id]
    setCollapsedColumns(newCollapsedColumns)
  }

  // SORT BY
  const sortByValue = useSelector((state) => state.dashboard.tasks.sortBy)
  // GROUP BY
  const groupByValue = useSelector((state) => state.dashboard.tasks.groupBy)

  // FILTER
  const filterValue = useSelector((state) => state.dashboard.tasks.filter)

  // GET ALL USERS FOR THE PROJECTS
  const { data: allUsers = [], isLoading: isLoadingAllUsers } = useGetKanBanUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  // attach assignees data to tasks
  const tasksWithAssignees = useMemo(() => {
    return tasks.map((task) => {
      const taskAssignees = allUsers.filter((user) => task.assignees.includes(user.name))
      return { ...task, assigneesData: taskAssignees }
    })
  }, [tasks, allUsers])

  // filter out projects by selected projects and filter value
  const filteredTasks = useMemo(
    () => getFilteredTasks(tasksWithAssignees, filterValue, selectedProjects),
    [tasksWithAssignees, filterValue, selectedProjects],
  )

  // sort tasks by sort by values
  const sortedTasks = useMemo(
    () => getSortedTasks(filteredTasks, sortByValue),
    [filteredTasks, sortByValue],
  )

  // This is the key that divides the tasks into columns
  // default is hardcoded to "status" but maybe in the future we can make this dynamic
  // the key also needs to be in the taskFields object
  const splitBy = view === 'list' ? groupByValue[0] && groupByValue[0].id : 'status'
  const splitByField = taskFields[splitBy]
  const splitByPlural = splitByField?.plural

  // arrange the tasks into columns by status
  const mergedFields = getMergedFields(projectsInfo, splitByPlural)

  const [tasksColumns, fieldsColumns] = useMemo(
    () => getTasksColumns(sortedTasks, splitBy, mergedFields, allUsers),
    [sortedTasks, splitBy, mergedFields],
  )

  const openFieldColumns = useMemo(() => {
    return fieldsColumns.map((field) => {
      const isCollapsed = collapsedColumns.includes(field.id)
      // count number of tasks in column
      const count = Object.values(tasksColumns).reduce((acc, column) => {
        const tasks = column.tasks.filter((task) => task[splitBy] === field.name)
        return acc + tasks.length
      }, 0)

      return { ...field, isCollapsed, count }
    })
  }, [fieldsColumns, collapsedColumns])

  // group openFieldColumns isCollapsed adjacent columns into one collapsed column
  const groupedOpenFieldColumns = useMemo(() => {
    const grouped = []
    let currentGroup = []
    openFieldColumns.forEach((column) => {
      if (column.isCollapsed) {
        currentGroup.push(column)
      } else {
        if (currentGroup.length) grouped.push(currentGroup)
        currentGroup = []
        grouped.push([column])
      }
    })
    if (currentGroup.length) grouped.push(currentGroup)
    return grouped
  }, [openFieldColumns])

  console.log(groupedOpenFieldColumns)

  // DND Stuff
  const touchSensor = useSensor(TouchSensor)
  const keyboardSensor = useSensor(KeyboardSensor)
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 1,
    },
  })

  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  // UPDATE TASK MUTATION
  const [updateTasks] = useUpdateTasksMutation()

  // keep track of which card is being dragged
  const [activeDraggingId, setActiveDraggingId] = useState(null)

  const handleDragStart = (event) => {
    setActiveDraggingId(event.active.id)
    // select card
    if (!selectedTasks.includes(event.active.id)) {
      setSelectedTasks([event.active.id])
    }
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
    let updatingTasks = [tasks.find((t) => t.id === activeCardId)]
    if (selectedTasks.length > 1) updatingTasks = tasks.filter((t) => selectedTasks.includes(t.id))
    if (!updatingTasks.length) return

    // build operations package for query
    const operations = updatingTasks.map((task) => {
      // card has moved columns, update the task
      const newTaskData = { [splitBy]: overColumn.name }

      // if the editing field is taskType and the task name is the same as the taskType, change name to new taskType
      if (splitBy === 'taskType' && task.name.toLowerCase() === task.taskType.toLowerCase()) {
        newTaskData.name = overColumn.name
      }

      return {
        projectName: task.projectName,
        id: task.id,
        data: newTaskData,
      }
    })

    updateTasks({ operations })
  }

  return (
    <Section style={{ height: '100%', zIndex: 10, padding: 0, overflow: 'hidden' }}>
      <DashboardTasksToolbar {...{ view, setView, allUsers, isLoadingAllUsers }} />
      {view === 'kanban' && (
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          autoScroll={false}
        >
          <ColumnsWrapper
            tasksColumns={tasksColumns}
            fieldsColumns={groupedOpenFieldColumns}
            groupByValue={groupByValue}
            isLoading={isLoading}
            allUsers={allUsers}
            disabledStatuses={disabledStatuses}
            onCollapsedColumnsChange={handleCollapseToggle}
          />
          <KanBanCardOverlay
            activeDraggingId={activeDraggingId}
            selectedTasks={selectedTasks}
            tasks={tasks}
          />
        </DndContext>
      )}
      {view === 'list' && (
        <UserDashboardList
          groupedFields={fieldsColumns.length ? fieldsColumns : [{ id: 'none' }]}
          groupedTasks={tasksColumns}
          isLoading={isLoading}
          allUsers={allUsers}
          mergedFields={mergedFields}
          groupByValue={groupByValue}
          statusesOptions={statusesOptions}
          disabledStatuses={disabledStatuses}
          disabledProjectUsers={disabledProjectUsers}
        />
      )}
    </Section>
  )
}

export default UserDashboardKanBan
