import { useMemo, useCallback } from 'react'
import { ColumnSizingState } from '@tanstack/react-table'
import type { TableRow } from '../types/table'

const DEFAULT_ROW_HEIGHT = 40
const THUMBNAIL_PADDING = 8
const THUMBNAIL_ASPECT_RATIO = 1.77 // 16:9

/**
 * Hook to calculate dynamic row height based on thumbnail column width and row data
 * Returns a function that calculates height per row based on whether it has thumbnail data
 */
const useDynamicRowHeight = (columnSizing: ColumnSizingState) => {
  const thumbnailRowHeight = useMemo(() => {
    // Get the current thumbnail column size
    const thumbnailSize = columnSizing.thumbnail

    if (!thumbnailSize) {
      return DEFAULT_ROW_HEIGHT
    }

    // Calculate the thumbnail display width (column width minus padding)
    const thumbnailWidth = thumbnailSize - THUMBNAIL_PADDING

    // Calculate required height based on aspect ratio and add padding
    const thumbnailHeight = thumbnailWidth / THUMBNAIL_ASPECT_RATIO
    const requiredRowHeight = thumbnailHeight + THUMBNAIL_PADDING

    // Ensure minimum row height
    return Math.max(requiredRowHeight, DEFAULT_ROW_HEIGHT)
  }, [columnSizing.thumbnail])

  // Function to calculate height for a specific row
  const getRowHeight = useCallback((_row: TableRow) => {
    // Return the same height for all rows when thumbnail column is resized
    return thumbnailRowHeight
  }, [thumbnailRowHeight])

  return { getRowHeight, thumbnailRowHeight, defaultRowHeight: DEFAULT_ROW_HEIGHT }
}

export default useDynamicRowHeight
