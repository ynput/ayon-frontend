import type { EditorTaskNode, TableRow } from '../types/table'

// Task columns: on a folder row, one column per task type showing that folder's tasks of the type.
// Their ids are prefixed so the table can tell them apart from field columns: paste and clear skip
// them (the cell edits a task, not the row's folder). The prefix must not be `task_` or `folder_`
// (parsed as a parent scope) and the id can't hold `-` (cell ids are parsed with a greedy pattern).
export const TASK_COLUMN_PREFIX = 'taskcol__'

export const isTaskColumnId = (columnId: string) => columnId.startsWith(TASK_COLUMN_PREFIX)

// Task type names are free text. Everything but letters and digits is written as its char code
// between underscores, so the id is safe in a CSS variable name and two names never share an id.
export const getTaskColumnId = (taskType: string) =>
  TASK_COLUMN_PREFIX +
  taskType.replace(/[^A-Za-z0-9]/g, (char) => `_${char.charCodeAt(0).toString(16)}_`)

/** The cache of its own the task columns keep in getOverviewTasksByFolders. */
export const TASK_COLUMNS_CACHE_SCOPE = 'taskColumns'

// one card in a default-width column, and a row made tall to show thumbnails
export const TASK_COLUMN_CARD_WIDTH = 180
export const TASK_COLUMN_EXPANDED_ROW_HEIGHT = 118

// rows that show task cards, and can be made tall: folders with tasks
export const isTaskRowExpandable = (row: TableRow) =>
  !row.group &&
  !row.metaType &&
  !row.isLoading &&
  row.primary.entityType === 'folder' &&
  !!row.primary.hasTasks

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** A folder's tasks by type, each type's tasks ordered by name. */
export const groupTasksByFolder = (tasks: EditorTaskNode[]) => {
  const byFolder = new Map<string, Map<string, EditorTaskNode[]>>()
  for (const task of tasks) {
    const byType = byFolder.get(task.folderId) || new Map<string, EditorTaskNode[]>()
    byFolder.set(task.folderId, byType)
    byType.set(task.taskType, [...(byType.get(task.taskType) || []), task])
  }
  byFolder.forEach((byType) =>
    byType.forEach((typeTasks) => typeTasks.sort((a, b) => nameCollator.compare(a.name, b.name))),
  )
  return byFolder
}

/**
 * A column's default width: one card times the most common number of tasks of the type per folder
 * (the Task progress rule), over the folders loaded so far.
 */
export const getTaskColumnDefaultWidths = (
  tasksByFolder: Map<string, Map<string, EditorTaskNode[]>>,
) => {
  const counts = new Map<string, Map<number, number>>()
  tasksByFolder.forEach((byType) =>
    byType.forEach((typeTasks, taskType) => {
      const typeCounts = counts.get(taskType) || new Map<number, number>()
      counts.set(taskType, typeCounts)
      typeCounts.set(typeTasks.length, (typeCounts.get(typeTasks.length) || 0) + 1)
    }),
  )
  const widths: Record<string, number> = {}
  counts.forEach((typeCounts, taskType) => {
    let majority = 1
    let folders = 0
    typeCounts.forEach((count, tasksPerFolder) => {
      if (count > folders || (count === folders && tasksPerFolder < majority)) {
        majority = tasksPerFolder
        folders = count
      }
    })
    widths[getTaskColumnId(taskType)] = majority * TASK_COLUMN_CARD_WIDTH
  })
  return widths
}
