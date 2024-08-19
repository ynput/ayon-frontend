import { FC, useMemo, useState } from 'react'
import { ProgressTask, useGetTasksProgressQuery } from '@queries/tasksProgress/getTasksProgress'
import { $Any } from '@types'
import { useSelector } from 'react-redux'
import {
  formatTaskProgressForTable,
  getStatusChangeOperations,
  getAssigneesChangeOperations,
} from './helpers'
import { useGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import { Status, TaskType } from '@api/rest'
import { ProgressSearch, TaskFieldChange, TasksProgressTable } from './components'
// state
import { setFocusedTasks } from '@state/context'
import { useDispatch } from 'react-redux'
import { useUpdateEntitiesMutation } from '@queries/entity/updateEntity'
import { toast } from 'react-toastify'
import { Section, Toolbar } from '@ynput/ayon-react-components'
import CategorySelect from '@components/CategorySelect/CategorySelect'
import useLocalStorage from '@hooks/useLocalStorage'

export type Operation = {
  id: string
  projectName: string
  data: { [key: string]: any }
  meta: { folderId: string }
}

interface TasksProgressProps {
  statuses?: Status[]
  taskTypes?: TaskType[]
  projectName: string
}

const TasksProgress: FC<TasksProgressProps> = ({ statuses = [], taskTypes = [], projectName }) => {
  const dispatch = useDispatch()

  // filter states
  const [filteredFolderIds, setFilteredFolderIds] = useState<null | string[]>(null)
  const [highlightedTaskIds, setHighlightedTaskIds] = useState<string[]>([])
  const [filteredTaskTypes, setFilteredTaskTypes] = useLocalStorage(
    `progress-types-${projectName}`,
    [],
  )

  const selectedFolders = useSelector((state: $Any) => state.context.focused.folders) as string[]
  const selectedTasks = useSelector((state: $Any) => state.context.focused.tasks) as string[]
  //   GET PROJECT ASSIGNEES
  const { data: users = [] } = useGetAllProjectUsersAsAssigneeQuery(
    { projectName },
    { skip: !projectName },
  )

  // GET TASKS PROGRESS FOR FOLDERS
  const { data: foldersTasksData = [] } = useGetTasksProgressQuery(
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
    () => formatTaskProgressForTable(foldersTasksData, filteredTaskTypes),
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

  const handleTaskSelect = (id: string, multiSelect: boolean) => {
    const newIds = []

    if (!multiSelect) {
      newIds.push(id)
    } else if (selectedTasks.includes(id)) {
      newIds.push(...selectedTasks.filter((taskId) => taskId !== id))
    } else {
      newIds.push(...selectedTasks, id)
    }

    dispatch(setFocusedTasks({ ids: newIds }))
  }

  return (
    <Section style={{ height: '100%' }} direction="column">
      <Toolbar>
        <ProgressSearch
          data={tableData}
          onSearch={(f, t) => {
            setFilteredFolderIds(f)
            setHighlightedTaskIds(t)
          }}
        />
        <CategorySelect
          value={filteredTaskTypes}
          options={taskTypes.map((taskType) => ({
            value: taskType.name,
            label: taskType.name,
            icon: taskType.icon,
          }))}
          onChange={(value) => setFilteredTaskTypes(value)}
          onClearNull={() => setFilteredTaskTypes([])}
          multiSelectClose={false}
          onSelectAll={() => {}}
          multiSelect
          placeholder="Filter task types..."
          style={{ width: 185 }}
        />
      </Toolbar>
      <TasksProgressTable
        tableData={filteredTableData}
        selectedAssignees={selectedAssignees}
        highlightedTasks={highlightedTaskIds}
        statuses={statuses}
        taskTypes={taskTypes} // for task icon etc.
        users={users}
        onChange={handleTaskFieldChange}
        onSelection={handleTaskSelect}
      />
    </Section>
  )
}

export default TasksProgress
