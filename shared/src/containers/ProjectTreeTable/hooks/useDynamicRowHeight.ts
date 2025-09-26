import { useCallback } from 'react'
import type { TableRow } from '../types/table'
import { useColumnSettingsContext } from '../context/ColumnSettingsContext'

const DEFAULT_ROW_HEIGHT = 40

/**
 * Hook to provide row height based on user setting from Customize panel
 * Returns a function that calculates height per row using the configured row height
 */
const useDynamicRowHeight = () => {
  const { rowHeight = DEFAULT_ROW_HEIGHT } = useColumnSettingsContext()

  console.log('useDynamicRowHeight: current rowHeight from context is', rowHeight) // Debug log

  // Function to calculate height for a specific row - avoid stale closure by not memoizing the function
  const getRowHeight = (_row: TableRow) => {
    console.log('useDynamicRowHeight: getRowHeight called, returning', rowHeight) // Debug log
    return rowHeight
  }

  return { getRowHeight, thumbnailRowHeight: rowHeight, defaultRowHeight: rowHeight }
}

export default useDynamicRowHeight
