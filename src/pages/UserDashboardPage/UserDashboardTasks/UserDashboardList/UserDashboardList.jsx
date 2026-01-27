import * as Styled from './UserDashboardList.styled'
import ListGroup from '../ListGroup/ListGroup'
import { useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { onCollapsedColumnsChanged, onTaskSelected } from '@state/dashboard'
import { getFakeTasks } from '../../util'
import { useTaskSpacebarViewer, usePrefetchEntity, useTaskClick } from '../../hooks'
import { useUpdateEntitiesMutation } from '@shared/api'
import { toast } from 'react-toastify'
import getPreviousTagElement from '@helpers/getPreviousTagElement'
import Shortcuts from '@containers/Shortcuts'
import { getGroupByOptions } from '../DashboardTasksToolbar/KanBanGroupByOptions'

const UserDashboardList = ({
  groupedTasks = {},
  groupedFields = [],
  groupByValue,
  isLoading,
  allUsers = [],
  statusesOptions,
  disabledStatuses,
  disabledProjectUsers,
  priorities,
  projectsInfo,
}) => {
  const containerRef = useRef(null)

  // create a ref for the list items
  const listItemsRef = useRef([])

  // filter out fields that have no tasks
  const filteredFields = useMemo(() => {
    return groupedFields.filter((field) => {
      const column = groupedTasks[field.id]
      return column && column.tasks.length > 0
    })
  }, [groupedFields, groupedTasks])

  // sort the groupedTasks by id alphabetically based on groupByValue sortBy
  // unless the groupByValue is status, then we keep the order of the statuses
  const sortedFields = useMemo(() => {
    if (groupByValue[0]) {
      const groupBy = groupByValue[0]
      const asc = groupBy.sortOrder

      // Check if this field should use enum order
      const groupByOptions = getGroupByOptions(false)
      const groupOption = groupByOptions.find((option) => option.id === groupBy.id)
      const shouldSortByEnumOrder = groupOption?.sortByEnumOrder

      // Get anatomy for enum sorting
      let anatomy = []
      if (shouldSortByEnumOrder) {
        if (groupBy.id === 'priority') {
          anatomy = priorities || []
        } else if (groupBy.id === 'status') {
          anatomy = statusesOptions || []
        }
      }

      // sort by id
      return [...filteredFields].sort((a, b) => {
        const hasATasksButBDoesNot = a.tasksCount === 0 && b.tasksCount > 0
        const hasBTasksButADoesNot = b.tasksCount === 0 && a.tasksCount > 0
        // If one group has tasks and the other does not, put the group without tasks at the end
        if (hasBTasksButADoesNot) return -1
        if (hasATasksButBDoesNot) return 1

        let aVal = a.id
        let bVal = b.id

        // Use enum order if specified
        if (shouldSortByEnumOrder && anatomy.length > 0) {
          const keyToMatch = groupBy.id === 'status' ? 'id' : 'value'
          const aIndex = anatomy.findIndex((option) => option[keyToMatch] === a.id)
          const bIndex = anatomy.findIndex((option) => option[keyToMatch] === b.id)
          aVal = aIndex !== -1 ? aIndex : 999 // put unknown values at end
          bVal = bIndex !== -1 ? bIndex : 999
        }

        const order = asc ? -1 : 1
        return typeof aVal === 'number'
          ? aVal < bVal
            ? -1 * order
            : aVal > bVal
            ? 1 * order
            : 0
          : aVal.localeCompare(bVal) * order
      })
    } else {
      return filteredFields
    }
  }, [filteredFields, groupByValue, priorities, statusesOptions])

  const dispatch = useDispatch()
  // get all task ids in order
  const tasks = useMemo(() => {
    return sortedFields.flatMap(({ id }) => {
      const column = groupedTasks[id]
      if (!column) return []
      return column.tasks
    })
  }, [groupedTasks, sortedFields])

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  // SELECTED TASKS
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const setSelectedTasks = (ids, types, data) => {
    const selectedData = data || tasks.filter((t) => ids.includes(t.id))
    dispatch(
      onTaskSelected({
        ids,
        types,
        data: selectedData.map((t) => ({
          id: t.id,
          projectName: t.projectName,
          taskType: t.taskType,
          name: t.name,
        })),
      }),
    )
  }

  const selectedTasksData = useMemo(
    () => tasks.filter((task) => selectedTasks.includes(task.id)),
    [tasks, selectedTasks],
  )

  // PREFETCH TASK WHEN HOVERING
  // we keep track of the ids that have been pre-fetched to avoid fetching them again
  const handlePrefetch = usePrefetchEntity(dispatch, projectsInfo, 300, 'dashboard')

  // HANDLE TASK CLICK
  const taskClick = useTaskClick(dispatch, tasks)

  // HANDLE SPACEBAR VIEWER OPEN SHORTCUT
  const handleSpacebar = useTaskSpacebarViewer({ tasks })

  // KEYBOARD SUPPORT
  const handleKeyDown = (e) => {
    // open viewer if spacebar is pressed
    handleSpacebar(e)

    // if there are no tasks, do nothing
    if (!taskIds.length) return

    // if arrow down, select next task
    if (e.key === 'ArrowDown') {
      e.preventDefault()

      const currentIndex = taskIds.indexOf(selectedTasks[selectedTasks.length - 1])
      const nextIndex = Math.min(taskIds.length - 1, currentIndex + 1)
      const nextTaskId = taskIds[nextIndex]
      const newIds = [nextTaskId]
      if (e.shiftKey) {
        // holding shift key, add to the selected tasks
        newIds.unshift(...selectedTasks)
      }

      // get task for newIds
      const newTasks = tasks.filter((task) => newIds.includes(task.id))
      // get taskTypes
      const newTypes = newTasks.map((task) => task.taskType)

      setSelectedTasks(newIds, newTypes, newTasks)

      // get the next li element based on the nextIndex from the ref
      const nextLi = listItemsRef.current[nextIndex]
      if (nextLi) {
        // scroll the container to show the next li element
        const containerRect = containerRef.current.getBoundingClientRect()
        const nextLiRect = nextLi.getBoundingClientRect()
        const nextLiTop = nextLiRect.top - containerRect.top
        const nextLiHeight = nextLiRect.height
        const containerScrollTop = containerRef.current.scrollTop
        const containerHeight = containerRect.height
        if (nextLiTop + nextLiHeight > containerHeight) {
          containerRef.current.scrollTo({
            top: containerScrollTop + nextLiTop + nextLiHeight - containerHeight,
          })
        } else if (nextLiTop < 0) {
          containerRef.current.scrollTo({ top: containerScrollTop + nextLiTop })
        }

        // first focus item
        nextLi.focus()
        // prefect the task after the next task
        const nextNextTask = tasks[nextIndex + 1]

        if (nextNextTask) {
          handlePrefetch(nextNextTask)
        }
      }
    }

    // if arrow up, select previous task
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const currentIndex = taskIds.indexOf(selectedTasks[0])
      const prevIndex = Math.max(0, currentIndex - 1)
      const prevTaskId = taskIds[prevIndex]
      const newIds = [prevTaskId]
      if (e.shiftKey) {
        // holding shift key, add to the selected tasks
        newIds.push(...selectedTasks)
      }

      // get task for newIds
      const newTasks = tasks.filter((task) => newIds.includes(task.id))
      // get taskTypes
      const newTypes = newTasks.map((task) => task.taskType)

      setSelectedTasks(newIds, newTypes, newTasks)

      // get the previous li element based on the prevIndex from the ref
      const prevLi = listItemsRef.current[prevIndex]
      if (prevLi) {
        // scroll the container to show the previous li element
        const containerRect = containerRef.current.getBoundingClientRect()
        const prevLiRect = prevLi.getBoundingClientRect()
        const prevLiTop = prevLiRect.top - containerRect.top
        const prevLiHeight = prevLiRect.height
        const containerScrollTop = containerRef.current.scrollTop
        const containerHeight = containerRect.height
        const headerHeight = groupByValue.length ? 42 : 0
        if (prevLiTop - prevLiHeight < 0) {
          containerRef.current.scrollTo({ top: containerScrollTop + prevLiTop - headerHeight })
        } else if (prevLiTop + prevLiHeight > containerHeight) {
          containerRef.current.scrollTo({
            top: containerScrollTop + prevLiTop + prevLiHeight - containerHeight,
          })
        }

        // focus item
        prevLi.focus()
        // prefect the task before the previous task
        const prevPrevTask = tasks[prevIndex - 1]

        if (prevPrevTask) {
          handlePrefetch(prevPrevTask)
        }
      }
    }
  }

  const handleTaskClick = (e, id) => {
    // update selected tasks
    taskClick(e, id, taskIds)
  }

  // COLLAPSED GROUPS
  const collapsedGroups = useSelector((state) => state.dashboard.tasks.collapsedColumns)
  const setCollapsedGroups = (ids) => dispatch(onCollapsedColumnsChanged(ids))

  const handleCollapseToggle = useCallback(
    (id) => {
      const newCollapsedGroups = collapsedGroups.includes(id)
        ? collapsedGroups.filter((groupId) => groupId !== id)
        : [...collapsedGroups, id]
      setCollapsedGroups(newCollapsedGroups)
    },
    [collapsedGroups],
  )

  // when users presses "c" over a group
  const handleShortcutCollapse = (event) => {
    const target = event?.target
    if (!target) return
    let id
    // check if target is HEADER or has 'group-header' class
    if (target.tagName === 'HEADER' || target.classList.contains('group-header')) {
      id = target.id
    } else if (target.closest('.group-header') || target.closest('header')) {
      id = target.closest('.group-header').id
      if (!id) id = target.closest('header').id
    }
    // check if target has closest li
    else if (target.closest('li')) {
      const li = target.closest('li')
      const previousHeader = getPreviousTagElement(li, 'HEADER')

      if (!previousHeader) return

      id = previousHeader.id
    } else return

    // update state
    id && handleCollapseToggle(id)
  }

  const [updateEntities] = useUpdateEntitiesMutation()
  const handleUpdate = async (field, value) => {
    try {
      // build tasks operations array
      const tasksOperations = selectedTasksData.map((task) => ({
        id: task.id,
        projectName: task.projectName,
        data: {
          [field]: value,
        },
        currentAssignees: task.users,
      }))

      await updateEntities({ operations: tasksOperations, entityType: 'task' })
    } catch (error) {
      toast.error('Error updating task(s)')
    }
  }

  // return 5 fake loading events if loading
  const [fakeColumns, fakeColumnsObject] = useMemo(() => {
    const fakeTasks = getFakeTasks(5)
    const columnsObject = fakeTasks.reduce((acc, column) => {
      return {
        ...acc,
        [column.id]: { tasks: getFakeTasks(), ...column },
      }
    }, {})

    return [fakeTasks, columnsObject]
  }, [])

  const shortcuts = useMemo(
    () => [
      {
        key: 'c',
        action: handleShortcutCollapse,
        closest: '.tasks-list',
      },
    ],
    [collapsedGroups],
  )

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[collapsedGroups]} />
      <Styled.ListContainer onKeyDown={handleKeyDown} className="tasks-list">
        <Styled.Inner ref={containerRef}>
          {isLoading
            ? fakeColumns.map((c) => (
                <ListGroup key={c.id} isLoading groups={fakeColumnsObject} id={c.id} />
              ))
            : sortedFields.flatMap(({ id }) => {
                const column = groupedTasks[id]
                if (!column) return []

                return (
                  <ListGroup
                    key={id}
                    groups={groupedTasks}
                    tasks={column.tasks}
                    id={id}
                    groupByValue={groupByValue}
                    allUsers={allUsers}
                    selectedTasks={selectedTasks}
                    onTaskSelected={handleTaskClick}
                    onTaskHover={(t) => handlePrefetch(t)}
                    statusesOptions={statusesOptions}
                    disabledStatuses={disabledStatuses}
                    disabledProjectUsers={disabledProjectUsers}
                    priorities={priorities}
                    onUpdate={handleUpdate}
                    isCollapsed={collapsedGroups.includes(id)}
                    onCollapseChange={handleCollapseToggle}
                    containerRef={containerRef}
                  />
                )
              })}
        </Styled.Inner>
      </Styled.ListContainer>
    </>
  )
}

export default UserDashboardList
