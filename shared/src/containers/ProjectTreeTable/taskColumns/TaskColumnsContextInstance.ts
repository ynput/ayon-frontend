import { createContext, useContext } from 'react'
import type { EnumItem, Status } from '@shared/api'
import type { EditorTaskNode } from '../types/table'
import type { TableUser } from '../context/project-table/ProjectTableContext'

export interface TaskColumnsContextValue {
  /** a task column is shown and the rows are folders */
  isActive: boolean
  /** the folder's tasks of the type, ordered by name; undefined until the folder has loaded */
  getTasks: (folderId: string, taskType: string) => EditorTaskNode[] | undefined
  /** a tall row shows thumbnails in its task columns */
  isRowExpanded: (rowId: string) => boolean
  toggleRowExpanded: (rowId: string) => void
  /** every folder row is tall; saved with the view */
  isAllExpanded: boolean
  toggleAllExpanded: () => void
  /** column widths until the user sets one, by column id */
  defaultWidths: Record<string, number>
  /** what the cards' pickers offer */
  statuses: Status[]
  priorities: EnumItem[]
  users: TableUser[]
  /**
   * The task a cell acts on as one (the viewer on Space): the card pressed last in it, else its
   * first. Undefined for a cell of another column, or without a task.
   */
  getCellTask: (rowId: string, columnId: string) => EditorTaskNode | undefined
  notePressedTask: (cellId: string, taskId: string) => void
  /**
   * A press on a cell, before the table selects it: which of the cell's cards it picks. A plain
   * press picks the pressed card alone, Ctrl/Cmd adds or removes it, Shift (a range) takes whole
   * cells. True when the table must leave its selection as it is (the cell stays selected, only
   * its cards changed).
   */
  pressCard: (
    cellId: string,
    taskId: string | undefined,
    cellTaskIds: string[],
    press: { isCellSelected: boolean; additive: boolean; range: boolean },
  ) => boolean
  /** the details panel shows the selected cards' tasks, until closed or no card is selected */
  openDetails: () => void
  closeDetails: () => void
  /** the page's task filter does not match the task: its card is greyed out */
  isTaskDimmed: (task: EditorTaskNode) => boolean
  /**
   * An edit made on a selected card. It goes to every selected card's task, less the greyed out
   * ones (a greyed out card is edited by itself).
   */
  editTasks: (task: EditorTaskNode, rowId: string, change: TaskCardChange) => Promise<void>
}

export type TaskCardChange =
  | { field: 'status' | 'priority'; value: string }
  // the whole list (one task), or what to add and remove on each task (several)
  | { field: 'assignees'; value: string[] }
  | { field: 'assignees'; added: string[]; removed: string[] }

/**
 * The selected cards. The table selects cells; a cell with several cards is selected with all of
 * them unless some were picked. Apart from the rest: it changes with every click.
 */
export interface TaskColumnsSelection {
  /** the cards picked in a selected cell, by cell id; a cell without picks has all its cards */
  picks: Record<string, string[]>
  /** every selected card's task */
  cardIds: string[]
  /** the tasks the details panel shows: the selected cards', once opened on one */
  detailsTaskIds: string[]
  /** the tasks an edit goes to: the selected cards', less greyed out ones and read-only rows */
  tasks: { task: EditorTaskNode; rowId: string }[]
  taskIds: Set<string>
  /** every assignee of those tasks, and on how many of them each is */
  assignees: string[]
  assigneeCounts: Record<string, number>
  /** selected folders whose tasks have not loaded: an edit leaves them out */
  notLoaded: number
}

// absent on tables without task columns (Lists, Versions/Products, addons' tables)
export const TaskColumnsContext = createContext<TaskColumnsContextValue | null>(null)

export const useTaskColumnsContext = () => useContext(TaskColumnsContext)

export const NO_TASK_COLUMNS_SELECTION: TaskColumnsSelection = {
  picks: {},
  cardIds: [],
  detailsTaskIds: [],
  tasks: [],
  taskIds: new Set(),
  assignees: [],
  assigneeCounts: {},
  notLoaded: 0,
}
export const TaskColumnsSelectionContext = createContext(NO_TASK_COLUMNS_SELECTION)

export const useTaskColumnsSelection = () => useContext(TaskColumnsSelectionContext)
