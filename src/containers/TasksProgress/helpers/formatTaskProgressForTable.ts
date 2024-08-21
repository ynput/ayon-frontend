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
  __isParent: boolean
  __folderKey: string
  _folder: string
  _parents: string[]
  _folderIcon?: string | null
  __folderType?: string
  __folderId: string
  __projectName: string
  _complete?: number
  [taskType: string]: TaskTypeRow | any
  // parent specific fields
  _numberOfTasks?: number
  _numberOfFolders?: number
  _completeFolders?: number[]
}

export const formatTaskProgressForTable = (
  data: GetTasksProgressResult,
  shownColumns: string[] = [],
  { folderTypes, statuses }: { folderTypes: FolderType[]; statuses: Status[] },
): FolderRow[] => {
  // TODO: try using a map instead of an array to easily lookup parent folders
  const rows = new Map<string, FolderRow>()

  data.forEach((folder) => {
    // add parent folder row

    const parent = folder.parent
    const parentKey = parent ? parent.id + '-parent' : undefined
    // check parent has not been added
    if (parent && parentKey && !rows.has(parentKey)) {
      //
      // add parent folder row
      const parentRow = {
        __isParent: true,
        __folderKey: parent.name,
        __folderId: parent.id,
        _folder: parent.label || parent.name,
        _parents: parent.parents,
        __projectName: folder.projectName,
        _numberOfFolders: 0,
        _numberOfTasks: 0,
        _completeFolders: [],
      }

      rows.set(parentKey, parentRow)
    }

    // add main folder row
    const row: FolderRow = {
      __isParent: false,
      __folderKey: folder.parents[folder.parents.length - 1] + folder.name, // used to sort the folders row
      _folder: folder.label || folder.name,
      _parents: folder.parents,
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

        if (typeof row[taskType] === 'object' && !Array.isArray(row[taskType])) {
          // update tasks
          row[taskType].tasks.push(task)

          const updateCompleted = () => {
            const status = task.status
            const statusType = statuses.find((s) => s.name === status)
            const statusState = statusType?.state
            const completed = statusState === 'done'
            const toAdd = completed ? taskFraction : 0
            const newDone = (row._complete || 0) + toAdd
            // rounded to 1 decimal
            row._complete = Math.round(newDone * 10) / 10
          }

          updateCompleted()
        }
      })

    // get existing parent folder
    const parentFolder = parent && rows.get(parentKey || '')
    if (parentFolder) {
      // update number of folders and tasks
      parentFolder._numberOfFolders = (parentFolder._numberOfFolders || 0) + 1
      parentFolder._numberOfTasks = (parentFolder._numberOfTasks || 0) + folder.tasks.length
      // add completed to parent folder completedFolders array
      // we do this so that later on we can calculate the actual percentage but we must loop through all folders first
      parentFolder._completeFolders?.push(row._complete || 0)
    }

    rows.set(folder.id, row)
  })

  // loop through all parent folders and calculate the percentage done
  rows.forEach((row) => {
    if (row.__isParent) {
      const completedFolders = row._completeFolders || []
      const average =
        completedFolders.reduce((acc, curr) => acc + curr, 0) / completedFolders.length
      row._complete = Math.round(average * 10) / 10
    }
  })

  const rowsArray = Array.from(rows.values())

  return rowsArray
}
