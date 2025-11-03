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
import { useUpdateEntitiesMutation } from '@shared/api'
import { toast } from 'react-toastify'

import ColumnsWrapper from './ColumnsWrapper'
import DashboardTasksToolbar from './DashboardTasksToolbar/DashboardTasksToolbar'
import {
  onCollapsedColumnsChanged,
  onDraggingEnd,
  onDraggingStart,
  onTaskSelected,
} from '@state/dashboard'
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
  priorities,
  projectUsers = [],
  isLoadingProjectUsers,
}) => {
  const dispatch = useDispatch()

  let columnGroups = {}

  // KANBAN or TASKS
  const [view, setView] = useQueryParam('view', withDefault(StringParam, 'kanban'))

  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const setSelectedTasks = (ids, types, data) =>
    dispatch(
      onTaskSelected({
        ids,
        types,
        data: tasks.map((data) => ({
          id: data.id,
          projectName: data.projectName,
          taskType: data.taskType,
          name: data.name,
        })),
      }),
    )

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

  // attach assignees data to tasks
  const tasksWithAssignees = useMemo(() => {
    return tasks.map((task) => {
      const taskAssignees = projectUsers.filter((user) => task.assignees.includes(user.name))
      return { ...task, assigneesData: taskAssignees }
    })
  }, [tasks, projectUsers])

  // filter out projects by selected projects and filter value
  const filteredTasks = useMemo(
    () => getFilteredTasks(tasksWithAssignees, filterValue, selectedProjects),
    [tasksWithAssignees, filterValue, selectedProjects],
  )

  // sort tasks by sort by values
  const sortedTasks = useMemo(
    () => getSortedTasks(filteredTasks, sortByValue, { priority: priorities }),
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
    () => getTasksColumns(sortedTasks, splitBy, mergedFields, projectUsers),
    [sortedTasks, splitBy, mergedFields],
  )

  const groupFieldColumns = useMemo(() => {
    const groupFieldColumns = []
    const fieldColumnsIds = new Set(fieldsColumns.map((field) => field.id))

    for (const key in columnGroups) {
      const group = columnGroups[key]
      const items = group.items?.flatMap((c) => fieldsColumns.find((f) => f.id === c) || []) || []
      const isCollapsed = collapsedColumns.includes(key)
      const tasksCount = items.reduce(
        (acc, column) => acc + (tasksColumns[column.id]?.tasks?.length || 0),
        0,
      )

      groupFieldColumns.push({
        ...group,
        id: key,
        items,
        isCollapsed,
        collapsed: [],
        count: tasksCount,
        isGroup: true,
      })

      items.forEach((column) => fieldColumnsIds.delete(column.id))
    }

    const remainingColumns = fieldsColumns.filter((field) => fieldColumnsIds.has(field.id))
    remainingColumns.forEach((column, index) => {
      const isCollapsed = collapsedColumns.includes(column.id)
      const tasksCount = tasksColumns[column.id]?.tasks?.length || 0
      groupFieldColumns.push({
        ...column,
        items: [column],
        isCollapsed,
        count: tasksCount,
        collapsed: [],
        isGroup: false,
        index: index,
      })
    })

    const filterdStatusIds = statusesOptions.map((status) => status.id)
    return groupFieldColumns.filter((item) => filterdStatusIds.includes(item.id))
  }, [columnGroups, fieldsColumns, collapsedColumns, tasksColumns, statusesOptions])

  // now sort the columns by index
  groupFieldColumns.sort((a, b) => a.index - b.index)

  // group openFieldColumns isCollapsed adjacent columns into one collapsed column
  const groupedOpenFieldColumns = useMemo(
    () =>
      groupFieldColumns.reduce((acc, column) => {
        const lastColumn = acc[acc.length - 1]
        if (column.isCollapsed) {
          // we add items to collapsed column
          if (lastColumn && lastColumn.isCollapsed === column.isCollapsed) {
            lastColumn.collapsed.push(column)
          } else {
            column.collapsed = [column]
            acc.push(column)
          }
        } else {
          // we check if this column belongs in a group column and if that group column is already in the list
          acc.push(column)
        }
        return acc
      }, []),
    [groupFieldColumns],
  )

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
  const [updateEntities] = useUpdateEntitiesMutation()

  // keep track of which card is being dragged
  const [activeDraggingId, setActiveDraggingId] = useState(null)

  const handleDragStart = (event) => {
    const isSelected = selectedTasks.includes(event.active.id)

    let draggingTasks = []
    // set dragging id
    if (isSelected) draggingTasks = selectedTasks
    else draggingTasks = [event.active.id]

    dispatch(onDraggingStart(draggingTasks))

    setActiveDraggingId(event.active.id)
    // select card
    if (!selectedTasks.includes(event.active.id)) {
      // get the task
      const task = tasks.find((t) => t.id === event.active.id)
      setSelectedTasks([event.active.id], [task.taskType], [task])
    }
  }

  const handleDragEnd = async (event) => {
    dispatch(onDraggingEnd())

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
        currentAssignees: task.assignees,
      }
    })

    updateEntities({ operations, entityType: 'task' })
  }

  return (
    <>
      <Section style={{ height: '100%', zIndex: 10, padding: 0, overflow: 'hidden' }}>
        <DashboardTasksToolbar {...{ view, setView, isLoadingProjectUsers }} />
        {view === 'kanban' && (
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            autoScroll={false}
          >
            <ColumnsWrapper
              allTasks={tasks}
              tasksColumns={tasksColumns}
              fieldsColumns={groupedOpenFieldColumns}
              groupByValue={groupByValue}
              isLoading={isLoading}
              projectUsers={projectUsers}
              disabledStatuses={disabledStatuses}
              onCollapsedColumnsChange={handleCollapseToggle}
              projectsInfo={projectsInfo}
              priorities={priorities}
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
            allUsers={projectUsers}
            mergedFields={mergedFields}
            groupByValue={groupByValue}
            statusesOptions={statusesOptions}
            disabledStatuses={disabledStatuses}
            disabledProjectUsers={disabledProjectUsers}
            projectsInfo={projectsInfo}
            priorities={priorities}
          />
        )}
      </Section>
    </>
  )
}

export default UserDashboardKanBan
