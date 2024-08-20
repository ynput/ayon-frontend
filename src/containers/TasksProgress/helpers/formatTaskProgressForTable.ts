import type { FolderType, Status } from '@api/rest'
import { GetTasksProgressResult, ProgressTask } from '@queries/tasksProgress/getTasksProgress'

export type TaskTypeRow = {
  name: string
  taskType: string
  tasks: ProgressTask[]
}

// no _ means it's a task type
// _ is for permanent columns
// __ is for metadata fields

export type FolderRow = {
  _folder: string
  _folderIcon?: string | null
  __folderType: string
  __folderId: string
  __projectName: string
  _complete: number
  [taskType: string]: TaskTypeRow | string | null | undefined | number
}

export const formatTaskProgressForTable = (
  data: GetTasksProgressResult,
  shownColumns: string[] = [],
  { folderTypes, statuses }: { folderTypes: FolderType[]; statuses: Status[] },
): FolderRow[] => {
  const rows: FolderRow[] = []

  data.forEach((folder) => {
    const row: FolderRow = {
      _folder: folder.label || folder.name,
      _folderIcon: folderTypes.find((ft) => ft.name === folder.folderType)?.icon,
      __folderId: folder.id,
      __folderType: folder.folderType,
      __projectName: folder.projectName,
      _complete: 0,
    }

    // find the percentages of each task
    const taskFraction = 100 / folder.tasks.length

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
          // update tasks
          row[taskType].tasks.push(task)

          const updateCompleted = () => {
            const status = task.status
            const statusType = statuses.find((s) => s.name === status)
            const statusState = statusType?.state
            const completed = statusState === 'done'
            const toAdd = completed ? taskFraction : 0
            const newDone = row._complete + toAdd
            // rounded to 1 decimal
            row._complete = Math.round(newDone * 10) / 10
          }

          updateCompleted()
        }
      })

    rows.push(row)
  })

  return rows
}
