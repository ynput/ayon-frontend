import { FolderType } from '@api/rest'
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
  _folderIcon?: string | null
  __folderType: string
  __folderId: string
  __projectName: string
  // completed: number
  [taskType: string]: TaskTypeRow | string | null | undefined
}

export const formatTaskProgressForTable = (
  data: GetTasksProgressResult,
  shownColumns: string[] = [],
  { folderTypes }: { folderTypes: FolderType[] },
): FolderRow[] => {
  const rows: FolderRow[] = []

  data.forEach((folder) => {
    const row: FolderRow = {
      _folder: folder.name,
      _folderIcon: folderTypes.find((ft) => ft.name === folder.folderType)?.icon,
      __folderId: folder.id,
      __folderType: folder.folderType,
      __projectName: folder.projectName,
    }

    // groups tasks by type
    folder.tasks
      .filter((t) => t.active)
      .forEach((task) => {
        const taskType = task.taskType

        // do not add if hidden
        if (!!shownColumns.length && !shownColumns.includes(taskType)) return

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
