import * as Styled from './UserDashboardList.styled'
import ListGroup from '../ListGroup/ListGroup'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { onCollapsedColumnsChanged, onTaskSelected } from '/src/features/dashboard'
import { getFakeTasks, usePrefetchTask, useTaskClick } from '../../util'
import { useUpdateTasksMutation } from '/src/services/userDashboard/updateUserDashboard'
import { toast } from 'react-toastify'
import useShortcuts from '/src/hooks/useShortcuts'
import getPreviousTagElement from '/src/helpers/getPreviousTagElement'

const UserDashboardList = ({
  groupedTasks = {},
  groupedFields = [],
  groupByValue,
  isLoading,
  allUsers = [],
  statusesOptions,
  disabledStatuses,
  disabledProjectUsers,
}) => {
  const containerRef = useRef(null)

  // create a ref for the list items
  const listItemsRef = useRef([])

  // sort the groupedTasks by id alphabetically based on groupByValue sortBy
  const sortedFields = useMemo(() => {
    if (groupByValue[0] && groupByValue[0].id !== 'status') {
      const asc = groupByValue[0].sortOrder
      // sort by id
      return [...groupedFields].sort((a, b) => {
        if (asc) {
          return a.id.localeCompare(b.id)
        } else {
          return b.id.localeCompare(a.id)
        }
      })
    }
    return groupedFields
  }, [groupedFields, groupByValue])

  // store a reference to the list items in the ref
  useEffect(() => {
    listItemsRef.current = containerRef.current.querySelectorAll('li:not(.none)')
  }, [containerRef.current, isLoading, groupedTasks, groupedFields])

  const dispatch = useDispatch()
  // get all task ids in order
  const tasks = useMemo(() => {
    return groupedFields.flatMap(({ id }) => {
      const column = groupedTasks[id]
      if (!column) return []
      return column.tasks
    })
  }, [groupedTasks, groupedFields])

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])

  // SELECTED TASKS
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const setSelectedTasks = (tasks) => dispatch(onTaskSelected(tasks))

  // Assignees
  const assigneesIsMe = useSelector((state) => state.dashboard.tasks.assigneesIsMe)

  const selectedTasksData = useMemo(
    () => tasks.filter((task) => selectedTasks.includes(task.id)),
    [tasks, selectedTasks],
  )

  // PREFETCH TASK WHEN HOVERING
  // we keep track of the ids that have been pre-fetched to avoid fetching them again
  const handlePrefetch = usePrefetchTask(dispatch)

  // HANDLE TASK CLICK
  const taskClick = useTaskClick(dispatch)

  // KEYBOARD SUPPORT
  const handleKeyDown = (e) => {
    // if there are no tasks, do nothing
    if (!taskIds.length) return

    // if arrow down, select next task
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
      setSelectedTasks(newIds)

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
      setSelectedTasks(newIds)

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

  const [updateTasks] = useUpdateTasksMutation()
  const handleUpdate = async (field, value) => {
    try {
      // build tasks operations array
      const tasksOperations = selectedTasksData.map((task) => ({
        id: task.id,
        projectName: task.projectName,
        data: {
          [field]: value,
        },
      }))

      await updateTasks({ operations: tasksOperations })
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

  useShortcuts(shortcuts, [collapsedGroups])

  return (
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
                  onUpdate={handleUpdate}
                  assigneesIsMe={assigneesIsMe}
                  isCollapsed={collapsedGroups.includes(id)}
                  onCollapseChange={handleCollapseToggle}
                />
              )
            })}
      </Styled.Inner>
    </Styled.ListContainer>
  )
}

export default UserDashboardList
