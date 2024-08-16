import { GetTasksProgressResult, ProgressTask } from '@queries/tasksProgress/getTasksProgress'

export type TaskTypeRow = {
  name: string
  taskType: string
  tasks: ProgressTask[]
}

// _ is for permanent columns
// __ is for metadata fields

export type FolderRow = {
  _folder: string
  __folderId: string
  __projectName: string
  // completed: number
  [taskType: string]: TaskTypeRow | string
}

export const formatTaskProgressForTable = (data: GetTasksProgressResult): FolderRow[] => {
  const rows: FolderRow[] = []

  data.forEach((folder) => {
    const row: FolderRow = {
      _folder: folder.name,
      __folderId: folder.id,
      __projectName: folder.projectName,
    }

    // groups tasks by type
    folder.tasks
      .filter((t) => t.active)
      .forEach((task) => {
        const taskType = task.taskType
        if (!row[taskType]) {
          row[taskType] = {
            name: taskType,
            taskType,
            tasks: [],
          }
        }

        if (typeof row[taskType] === 'object') {
          row[taskType].tasks.push(task)
        }
      })

    rows.push(row)
  })

  return rows
}
