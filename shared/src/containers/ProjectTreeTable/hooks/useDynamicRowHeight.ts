import { useMemo, useCallback, useRef, useEffect } from 'react'
import { ColumnSizingState } from '@tanstack/react-table'
import type { TableRow } from '../types/table'
import { getCellId } from '../utils/cellUtils'

const DEFAULT_ROW_HEIGHT = 40
const THUMBNAIL_PADDING = 8
const THUMBNAIL_ASPECT_RATIO = 1.77 // 16:9

/**
 * Hook to calculate dynamic row height based on thumbnail column width and selection state
 * Only changes height during column resize, not during selection changes
 */
const useDynamicRowHeight = (
  columnSizing: ColumnSizingState,
  isRowSelected: (rowId: string) => boolean,
  isCellSelected: (cellId: string) => boolean,
  isResizing: boolean, // New parameter to track if column is being resized
) => {
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

  // Track which rows should be expanded based on selection during resize
  const expandedRowsRef = useRef<Set<string>>(new Set())

  // Update expanded rows only when resizing
  useEffect(() => {
    if (isResizing) {
      // During resize, capture currently selected rows
      expandedRowsRef.current = new Set()
      // We can't iterate through all rows here, so we'll check in getRowHeight
    }
  }, [isResizing])

  // Function to calculate height for a specific row
  const getRowHeight = useCallback((row: TableRow) => {
    // Check if the row is selected or if the thumbnail cell is selected
    const thumbnailCellId = getCellId(row.id, 'thumbnail')
    const isRowOrThumbnailSelected = isRowSelected(row.id) || isCellSelected(thumbnailCellId)

    // During resize: update the expanded rows set and apply height changes
    if (isResizing) {
      if (isRowOrThumbnailSelected) {
        expandedRowsRef.current.add(row.id)
      } else {
        expandedRowsRef.current.delete(row.id)
      }
    }

    // Return expanded height only for rows that were selected during resize AND column is wider than default
    const shouldExpand = expandedRowsRef.current.has(row.id) && columnSizing.thumbnail && columnSizing.thumbnail > 63
    return shouldExpand ? thumbnailRowHeight : DEFAULT_ROW_HEIGHT
  }, [thumbnailRowHeight, isRowSelected, isCellSelected, columnSizing.thumbnail, isResizing])

  return { getRowHeight, thumbnailRowHeight, defaultRowHeight: DEFAULT_ROW_HEIGHT }
}

export default useDynamicRowHeight
