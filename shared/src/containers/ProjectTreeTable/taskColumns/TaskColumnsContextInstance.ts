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
  /** the page's task filter does not match the task: its card is greyed out */
  isTaskDimmed: (task: EditorTaskNode) => boolean
  /**
   * An edit made on a card. With one task cell selected it goes to the card's task; with several,
   * to every task the selected cells show, less the greyed out ones.
   */
  editTasks: (task: EditorTaskNode, rowId: string, change: TaskCardChange) => Promise<void>
}

export type TaskCardChange =
  | { field: 'status' | 'priority'; value: string }
  // the whole list (one task), or what to add and remove on each task (several)
  | { field: 'assignees'; value: string[] }
  | { field: 'assignees'; added: string[]; removed: string[] }

/** The task cells in the table's selection. Apart from the rest: it changes with every click. */
export interface TaskColumnsSelection {
  /** selected task cells on folder rows */
  cells: number
  /** the tasks an edit of several cells goes to */
  tasks: { task: EditorTaskNode; rowId: string }[]
  /** every assignee of those tasks */
  assignees: string[]
  /** selected folders whose tasks have not loaded: an edit leaves them out */
  notLoaded: number
}

// absent on tables without task columns (Lists, Versions/Products, addons' tables)
export const TaskColumnsContext = createContext<TaskColumnsContextValue | null>(null)

export const useTaskColumnsContext = () => useContext(TaskColumnsContext)

export const NO_TASK_COLUMNS_SELECTION: TaskColumnsSelection = {
  cells: 0,
  tasks: [],
  assignees: [],
  notLoaded: 0,
}
export const TaskColumnsSelectionContext = createContext(NO_TASK_COLUMNS_SELECTION)

export const useTaskColumnsSelection = () => useContext(TaskColumnsSelectionContext)
