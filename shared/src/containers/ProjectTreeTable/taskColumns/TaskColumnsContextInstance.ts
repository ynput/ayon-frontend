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
}

// absent on tables without task columns (Lists, Versions/Products, addons' tables)
export const TaskColumnsContext = createContext<TaskColumnsContextValue | null>(null)

export const useTaskColumnsContext = () => useContext(TaskColumnsContext)
