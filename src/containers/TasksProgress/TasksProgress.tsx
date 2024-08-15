import { FC, useMemo } from 'react'
import { useGetTasksProgressQuery } from '@queries/tasksProgress/getTasksProgress'
import { $Any } from '@types'
import { useSelector } from 'react-redux'
import { formatTaskProgressForTable } from './helpers'
import { useGetAllProjectUsersAsAssigneeQuery } from '@queries/user/getUsers'
import { Status, TaskType } from '@api/rest'
import { TaskFieldChange, TasksProgressTable } from './components'
// state
import { setFocusedTasks } from '@state/context'
import { useDispatch } from 'react-redux'

interface TasksProgressProps {
  statuses?: Status[]
  taskTypes?: TaskType[]
  projectName: string
}

const TasksProgress: FC<TasksProgressProps> = ({ statuses = [], taskTypes = [], projectName }) => {
  const dispatch = useDispatch()

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

  const tableData = useMemo(() => formatTaskProgressForTable(foldersTasksData), [foldersTasksData])

  const handleTaskFieldChange: TaskFieldChange = async (id, key, value) => {}

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
    <div style={{ height: '100%' }}>
      <TasksProgressTable
        tableData={tableData}
        statuses={statuses}
        taskTypes={taskTypes}
        users={users}
        onChange={handleTaskFieldChange}
        onSelection={handleTaskSelect}
      />
    </div>
  )
}

export default TasksProgress
