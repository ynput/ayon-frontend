import { FC, useMemo, useState, useRef } from 'react'
import { ProgressTask, useGetTasksProgressQuery } from '@queries/tasksProgress/getTasksProgress'
import { $Any } from '@types'
import { useSelector } from 'react-redux'
import {
  formatTaskProgressForTable,
  getStatusChangeOperations,
  getAssigneesChangeOperations,
  resolveShiftSelect,
} from './helpers'
import { useGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import { FolderType, Status, TaskType } from '@api/rest/project'
import { ProgressSearch, TaskFieldChange, TasksProgressTable } from './components'
// state
import { setFocusedTasks } from '@state/context'
import { useDispatch } from 'react-redux'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { toast } from 'react-toastify'
import { Button, Section, ShortcutTag, Spacer, Toolbar } from '@ynput/ayon-react-components'
import CategorySelect from '@components/CategorySelect/CategorySelect'
import useLocalStorage from '@hooks/useLocalStorage'
import Shortcuts from '@containers/Shortcuts'
import { openViewer } from '@state/viewer'
import EmptyPlaceholder from '@components/EmptyPlaceholder/EmptyPlaceholder'
import './styles.scss'

export type Operation = {
  id: string
  projectName: string
  data: { [key: string]: any }
  meta: { folderId: string }
}

interface TasksProgressProps {
  statuses?: Status[]
  taskTypes?: TaskType[]
  folderTypes?: FolderType[]
  projectName: string
}

const TasksProgress: FC<TasksProgressProps> = ({
  statuses = [],
  taskTypes = [],
  folderTypes = [],
  projectName,
}) => {
  const dispatch = useDispatch()
  const tableRef = useRef<any>(null)

  // filter states
  const [filteredFolderIds, setFilteredFolderIds] = useState<null | string[]>(null)
  const [filteredTaskTypes, setFilteredTaskTypes] = useLocalStorage(
    `progress-types-${projectName}`,
    [],
  )

  // should rows be expanded (unless in collapsedRows)
  const [expandAll, setExpandAll] = useState(false)
  // explicitly expanded rows even when allExpanded is false
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  // explicitly collapsed rows even when allExpanded is true
  const [collapsedRows, setCollapsedRows] = useState<string[]>([])

  // hide parent folder child rows
  const [collapsedParents, setCollapsedParents] = useState<string[]>([])

  const selectedFolders = useSelector((state: $Any) => state.context.focused.folders) as string[]
  const selectedTasks = useSelector((state: $Any) => state.context.focused.tasks) as string[]
  const [activeTask, setActiveTask] = useState<string | null>(null)
  //   GET PROJECT ASSIGNEES
  const { data: users = [] } = useGetAllProjectUsersAsAssigneeQuery(
    { projectName },
    { skip: !projectName },
  )

  // VVV MAIN QUERY VVV
  //
  //
  // GET TASKS PROGRESS FOR FOLDERS
  const {
    data: foldersTasksData = [],
    isFetching: isFetchingTasks,
    error,
  } = useGetTasksProgressQuery(
    { projectName, folderIds: selectedFolders },
    { skip: !selectedFolders.length || !projectName },
  )
  //
  //
  // ^^^ MAIN QUERY ^^^

  // create a map of all tasks
  const allTasksMap = useMemo(() => {
    const map = new Map<string, ProgressTask>()
    foldersTasksData.forEach((folder) => {
      folder.tasks.forEach((task) => {
        map.set(task.id, task)
      })
    })
    return map
  }, [foldersTasksData])

  // array of all selected tasks
  const selectedTasksData = useMemo(
    () => selectedTasks.flatMap((taskId) => allTasksMap.get(taskId) || []),
    [selectedTasks, allTasksMap],
  )

  // unique array of all assignees of selected tasks
  const selectedAssignees = useMemo(() => {
    const assignees = new Set<string>()
    selectedTasksData.forEach((task) => {
      task.assignees.forEach((assignee) => assignees.add(assignee))
    })
    return Array.from(assignees)
  }, [selectedTasksData])

  const tableData = useMemo(
    () =>
      formatTaskProgressForTable(foldersTasksData, filteredTaskTypes, collapsedParents, {
        folderTypes,
        statuses,
      }),
    [foldersTasksData, filteredTaskTypes, collapsedParents],
  )

  const filteredTableData = useMemo(() => {
    let filtered = tableData

    // search filter
    if (filteredFolderIds) {
      filtered = tableData.filter((row) => filteredFolderIds.includes(row.__folderId))
    }

    return filtered
  }, [tableData, filteredFolderIds])

  const [updateEntities] = useUpdateEntitiesMutation()

  const handleUpdateEntities = async (operations: Operation[]) => {
    try {
      await updateEntities({ operations, entityType: 'task' })
    } catch (error) {
      console.error(error)
      toast.error('Failed to update task status')
    }
  }

  const handleTaskFieldChange: TaskFieldChange = (_taskId, key, added, removed) => {
    // filter out allTasksMap to only include tasks that are selected
    let operations: Operation[] = []
    switch (key) {
      case 'status':
        operations = getStatusChangeOperations(selectedTasksData, projectName, added[0])
        break
      case 'assignee':
        operations = getAssigneesChangeOperations(selectedTasksData, projectName, added, removed)
        break
      default:
        break
    }

    handleUpdateEntities(operations)
  }

  const handleTaskSelect = (id: string, meta: boolean, shift: boolean) => {
    const newIds = []

    if (shift) {
      // get correct index of the selected task
      const tableEl = tableRef.current?.getTable()

      if (!tableEl) return

      const taskIds = resolveShiftSelect(id, tableEl)

      dispatch(setFocusedTasks({ ids: taskIds }))

      return
    }

    let newActiveId: string | null = id
    if (!meta) {
      // single select
      newIds.push(id)
    } else if (selectedTasks.includes(id)) {
      // remove the task from the selected tasks
      newIds.push(...selectedTasks.filter((taskId) => taskId !== id))
      // change active task to the last selected task else to null
      newActiveId = newIds[newIds.length - 1] || null
    } else {
      // add the task to the selected tasks
      newIds.push(...selectedTasks, id)
    }

    setActiveTask(newActiveId)

    dispatch(setFocusedTasks({ ids: newIds }))
  }

  const handleExpandToggle = (folderId: string) => {
    // check current state of the folderId
    const isExpanded =
      (expandedRows.includes(folderId) || expandAll) && !collapsedRows.includes(folderId)
    // update the expanded rows by either adding or removing the folderId
    const newExpandedRows = [...expandedRows]
    const newCollapsedRows = [...collapsedRows]

    if (isExpanded) {
      // remove from expanded rows
      newExpandedRows.splice(newExpandedRows.indexOf(folderId), 1)
      // add to collapsed rows
      newCollapsedRows.push(folderId)
    } else {
      // add to expanded rows
      newExpandedRows.push(folderId)
      // remove from collapsed rows
      newCollapsedRows.splice(newCollapsedRows.indexOf(folderId), 1)
    }

    setExpandedRows(newExpandedRows)
    setCollapsedRows(newCollapsedRows)

    if (!expandedRows.length && expandAll) {
      const allTasksLength = filteredTableData.filter((row) => !row.__isParent).length
      if (allTasksLength === newCollapsedRows.length) {
        setExpandAll(false)
      }
    }
  }

  const viewerIsOpen = useSelector((state: $Any) => state.viewer.isOpen)
  const openInViewer = (id: string, quickView: boolean) => {
    if (id && !viewerIsOpen) {
      dispatch(openViewer({ taskId: id, projectName: projectName, quickView }))
    }
  }

  const handleExpandAllToggle = () => {
    // reset all collapsed and expanded rows
    setCollapsedRows([])
    setExpandedRows([])
    // set expand all to the opposite of the current state
    setExpandAll(!expandAll)
  }

  const handleCollapseToggle = (id: string) => {
    // update the collapsed rows by either adding or removing the folderId
    setCollapsedParents((prev) => {
      if (prev.includes(id)) {
        return prev.filter((folderId) => folderId !== id)
      }
      return [...prev, id]
    })
  }

  const shortcuts = [
    {
      key: 'E',
      action: handleExpandAllToggle,
    },
  ]

  return (
    <>
      <Shortcuts shortcuts={shortcuts} deps={[expandedRows]} />
      <Section style={{ height: '100%' }} direction="column">
        <Toolbar>
          <ProgressSearch data={tableData} onSearch={setFilteredFolderIds} />
          <CategorySelect
            value={filteredTaskTypes}
            options={taskTypes.map((taskType) => ({
              value: taskType.name,
              label: taskType.name,
              icon: taskType.icon,
            }))}
            onChange={(value) => setFilteredTaskTypes(value)}
            onClearNull={filteredTaskTypes.length ? () => setFilteredTaskTypes([]) : undefined}
            multiSelectClose={false}
            onSelectAll={() => {}}
            multiSelect
            placeholder="Filter task types..."
            style={{ width: 185 }}
          />
          <Spacer />
          <Button
            onClick={handleExpandAllToggle}
            icon={expandAll ? 'collapse_all' : 'expand_all'}
            style={{ width: 220, justifyContent: 'flex-start' }}
            selected={expandAll}
          >
            {`${expandAll ? 'Collapse' : 'Expand'} all rows`}
            <ShortcutTag style={{ marginLeft: 'auto' }}>Shift + E</ShortcutTag>
          </Button>
        </Toolbar>
        {selectedFolders.length ? (
          filteredTableData.length || isFetchingTasks ? (
            <TasksProgressTable
              tableRef={tableRef}
              tableData={filteredTableData}
              projectName={projectName}
              isLoading={isFetchingTasks}
              selectedFolders={selectedFolders}
              activeTask={activeTask}
              selectedAssignees={selectedAssignees}
              statuses={statuses} // status icons etc.
              taskTypes={taskTypes} // for tasks icon etc.
              users={users}
              onChange={handleTaskFieldChange}
              onSelection={handleTaskSelect}
              allExpanded={expandAll}
              expandedRows={expandedRows}
              collapsedRows={collapsedRows}
              onExpandRow={handleExpandToggle}
              onOpenViewer={openInViewer}
              collapsedParents={collapsedParents}
              onCollapseRow={handleCollapseToggle}
            />
          ) : (
            <EmptyPlaceholder
              message={
                filteredFolderIds
                  ? ' No results found. Try a different search.'
                  : 'No tasks under this folder. Try selecting another one.'
              }
              icon="folder_open"
            />
          )
        ) : (
          <EmptyPlaceholder
            message={'Select a folder to begin.'}
            icon="folder_open"
            error={error}
          />
        )}
      </Section>
    </>
  )
}

export default TasksProgress
