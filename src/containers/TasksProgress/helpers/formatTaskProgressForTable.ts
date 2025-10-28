import type { FolderType, Status } from '@shared/api'
import {
  FolderGroup,
  ProgressTask,
  ProgressTaskFolder,
} from '@queries/tasksProgress/getTasksProgress'

export type TaskTypeRow = {
  name: string
  taskType: string
  tasks: ProgressTask[]
}

export type TaskTypeStatusBar = {
  [status: string]: number
}

// no _ means it's a task type
// _ is for permanent columns
// __ is for metadata fields

export type FolderRow = {
  __isParent: boolean
  __parentId?: string
  __folderKey: string
  _folder: string
  _parents: string[]
  __folderIcon?: string | null
  __folderType?: string
  __folderId: string
  __folderUpdatedA?: string
  __folderStatus?: string
  __projectName: string
  _complete?: number
  [taskType: string]: TaskTypeRow | TaskTypeStatusBar | any
  // parent specific fields
  _taskCount?: number
  _folderCount?: number
  _completeFolders?: number[]
}

interface FolderTask extends ProgressTaskFolder {
  projectName: string
  tasks: (ProgressTask & { isHidden?: boolean })[]
}

const getParentKey = (parent: FolderGroup['parent']) =>
  parent ? `${parent.id}-${parent.name}` : undefined

export const formatTaskProgressForTable = (
  data: FolderTask[],
  collapsedFolders: string[] = [],
  {
    folderTypes,
    taskStatuses,
  }: { folderTypes: FolderType[]; taskStatuses: Status[]; folderStatuses: Status[] },
): FolderRow[] => {
  // TODO: try using a map instead of an array to easily lookup parent folders
  const rows = new Map<string, FolderRow>()
  const parents = new Set<string>()

  data.forEach((folder) => {
    // add parent folder row

    const parent = folder.parent
    const parentKey = getParentKey(parent)
    // check parent has not been added
    if (parent && parentKey && !parents.has(parentKey)) {
      //
      // add parent folder row
      const parentRow = {
        __isParent: true,
        __folderKey: parent.name,
        __folderId: parent.id,
        _folder: parent.label || parent.name,
        _parents: parent.parents,
        __projectName: folder.projectName,
        _folderCount: 0,
        _taskCount: 0,
        _completeFolders: [],
      }

      rows.set(parentKey, parentRow)
      // add to parents set to keep track of parent folders added
      parents.add(parentKey)
    }

    // add main folder row
    const row: FolderRow = {
      __isParent: false,
      __parentId: parent?.id,
      __folderKey: folder.parents.length
        ? folder.parents[folder.parents.length - 1] + folder.name
        : 'root' + folder.name, // used to sort the folders row
      _folder: folder.label || folder.name,
      _parents: folder.parents,
      __folderIcon: folderTypes.find((ft) => ft.name === folder.folderType)?.icon,
      __folderId: folder.id,
      __folderType: folder.folderType,
      __folderUpdatedAt: folder.updatedAt,
      __folderStatus: folder.status,
      __projectName: folder.projectName,
      _complete: 0,
    }

    // find the percentages of each task
    const taskFraction = 100 / folder.tasks.length

    const activeTasks = folder.tasks.filter((t) => t.active)

    // groups tasks by type
    activeTasks.forEach((task) => {
      const taskType = task.taskType

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
          const statusType = taskStatuses.find((s) => s.name === status)
          const statusState = statusType?.state
          const completed = statusState === 'done'
          const toAdd = completed ? taskFraction : 0
          const newDone = (row._complete || 0) + toAdd
          // rounded to 1 decimal
          row._complete = newDone
        }

        updateCompleted()
      }
    })

    // get existing parent folder
    const parentFolder = parent && rows.get(parentKey || '')
    if (parentFolder?.__isParent) {
      const tasks = folder.tasks.filter((t) => t.active)
      // update number of folders and tasks
      parentFolder._folderCount = (parentFolder._folderCount || 0) + 1
      parentFolder._taskCount = (parentFolder._taskCount || 0) + tasks.length
      // add completed to parent folder completedFolders array
      // we do this so that later on we can calculate the actual percentage but we must loop through all folders first
      parentFolder._completeFolders?.push(row._complete || 0)

      // get all statuses for that folders (row) task types
      const taskTypeStatuses = tasks.reduce((acc, curr) => {
        // initialize task type status
        if (!acc[curr.taskType]) {
          acc[curr.taskType] = {
            [curr.status]: 0,
          }
        }

        // update task type status
        acc[curr.taskType][curr.status] = (acc[curr.taskType][curr.status] || 0) + 1

        return acc
      }, {} as { [taskType: string]: TaskTypeStatusBar })

      // update parent folder with statuses
      Object.entries(taskTypeStatuses).forEach(([taskType, status]) => {
        if (!parentFolder[taskType]) {
          parentFolder[taskType] = status
        } else {
          // merge statuses
          Object.entries(status).forEach(([statusName, count]) => {
            parentFolder[taskType][statusName] = (parentFolder[taskType][statusName] || 0) + count
          })
        }
      })
    }

    // add to rows
    rows.set(folder.id, row)
  })

  // loop through all parent folders and calculate the percentage done
  rows.forEach((row) => {
    if (row.__isParent) {
      const completedFolders = row._completeFolders || []
      const average =
        completedFolders.reduce((acc, curr) => acc + curr, 0) / completedFolders.length
      row._complete = average
    }
  })

  const rowsArray = Array.from(rows.values())

  // filter out folders with no tasks
  let filteredRows = rowsArray
  filteredRows = rowsArray.filter((row) => {
    if (row.__isParent) return true
    const hasNoTasks = Object.keys(row)
      .filter((key) => !key.startsWith('_'))
      .every((taskType) => {
        const tasks = row[taskType]
        return tasks && tasks.tasks.length === 0
      })

    return !hasNoTasks
  })

  // filter out parent rows that have no children and NOT collapsedFolders
  filteredRows = filteredRows.filter((row) => {
    if (!row.__isParent) return true

    return filteredRows.some((r) => r.__parentId === row.__folderId)
  })

  // filter out tasks where their parent is collapsed
  filteredRows = filteredRows.filter((row) => {
    if (row.__isParent) return true
    const parent = row.__parentId
    const isCollapsed = collapsedFolders.includes(parent || '')

    return !isCollapsed
  })

  return filteredRows
}
