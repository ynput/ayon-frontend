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
import { FolderType, Status, TaskType } from '@api/rest'
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
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  const selectedFolders = useSelector((state: $Any) => state.context.focused.folders) as string[]
  const selectedTasks = useSelector((state: $Any) => state.context.focused.tasks) as string[]
  const [activeTask, setActiveTask] = useState<string | null>(null)
  //   GET PROJECT ASSIGNEES
  const { data: users = [] } = useGetAllProjectUsersAsAssigneeQuery(
    { projectName },
    { skip: !projectName },
  )

  // GET TASKS PROGRESS FOR FOLDERS
  const { data: foldersTasksData = [], isFetching: isFetchingTasks } = useGetTasksProgressQuery(
    { projectName, folderIds: selectedFolders },
    { skip: !selectedFolders.length || !projectName },
  )

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
      formatTaskProgressForTable(foldersTasksData, filteredTaskTypes, { folderTypes, statuses }),
    [foldersTasksData, filteredTaskTypes],
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
    // update the expanded rows by either adding or removing the folderId
    setExpandedRows((prev) => {
      if (prev.includes(folderId)) {
        return prev.filter((id) => id !== folderId)
      }
      return [...prev, folderId]
    })
  }

  const viewerIsOpen = useSelector((state: $Any) => state.viewer.isOpen)
  const openInViewer = (id: string, quickView: boolean) => {
    if (id && !viewerIsOpen) {
      dispatch(openViewer({ taskId: id, projectName: projectName, quickView }))
    }
  }

  // are more than half of the rows expanded?
  const shouldExpand = expandedRows.length < filteredTableData.length / 2
  const handleExpandAllToggle = () => {
    if (shouldExpand) {
      setExpandedRows(filteredTableData.map((row) => row.__folderId))
    } else {
      setExpandedRows([])
    }
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
            icon={shouldExpand ? 'expand_all' : 'collapse_all'}
            style={{ width: 220, justifyContent: 'flex-start' }}
          >
            {`${shouldExpand ? 'Expand' : 'Collapse'} all rows`}
            <ShortcutTag style={{ marginLeft: 'auto' }}>Shift + E</ShortcutTag>
          </Button>
        </Toolbar>
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
          expandedRows={expandedRows}
          onExpandRow={handleExpandToggle}
          onOpenViewer={openInViewer}
        />
      </Section>
    </>
  )
}

export default TasksProgress
