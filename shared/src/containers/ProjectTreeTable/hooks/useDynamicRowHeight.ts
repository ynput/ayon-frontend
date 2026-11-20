import type { TableRow } from '../types/table'
import { useColumnSettingsContext } from '../context/column-settings'
import { useTaskColumnsContext } from '../taskColumns/TaskColumnsContextInstance'
import {
  isTaskRowExpandable,
  TASK_COLUMN_EXPANDED_ROW_HEIGHT,
} from '../taskColumns/taskColumnsHelpers'

const DEFAULT_ROW_HEIGHT = 24

/**
 * Hook to provide row height based on user setting from Customize panel
 * Returns a function that calculates height per row using the configured row height
 */
const useDynamicRowHeight = () => {
  const { rowHeight = DEFAULT_ROW_HEIGHT } = useColumnSettingsContext()

  const taskColumns = useTaskColumnsContext()

  // Function to calculate height for a specific row - avoid stale closure by not memoizing the function
  const getRowHeight = (row: TableRow) => {
    // a folder row made tall to show its task cards' thumbnails (task columns)
    if (isTaskRowExpandable(row) && taskColumns?.isRowExpanded(row.id)) {
      return Math.max(rowHeight, TASK_COLUMN_EXPANDED_ROW_HEIGHT)
    }
    return rowHeight
  }

  return { getRowHeight, thumbnailRowHeight: rowHeight, defaultRowHeight: rowHeight }
}

export default useDynamicRowHeight
