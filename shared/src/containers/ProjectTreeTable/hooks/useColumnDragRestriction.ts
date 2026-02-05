import { useCallback, useRef, useState } from 'react'
import { type Modifier } from '@dnd-kit/core'
import { ColumnPinningState, ColumnSizingState } from '@tanstack/react-table'

interface UseColumnDragRestrictionProps {
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
}

// Data attribute used to identify the table container
export const TABLE_CONTAINER_ATTR = 'data-column-dnd-container'

// Allow columns to overlap into opposite section for better UX
const DRAG_OVERLAP_ALLOWANCE = 100

/**
 * Hook that provides drag restriction logic for column reordering.
 * Prevents dragging columns across pinned/unpinned boundaries.
 */
export const useColumnDragRestriction = ({
  columnPinning,
  columnSizing,
}: UseColumnDragRestrictionProps) => {
  const [activePinnedState, setActivePinnedState] = useState<boolean | null>(null)

  // Cached boundary position - set at drag start, avoids DOM queries per frame
  const cachedBoundaryRef = useRef<number | null>(null)

  // Calculate boundary position (total width of pinned section) - fallback only
  const getPinnedSectionWidth = useCallback(() => {
    const pinnedColumns = columnPinning.left || []
    let width = 24 // Selection column base width
    pinnedColumns.forEach((colId) => {
      width += columnSizing[colId] || 150
    })
    return width
  }, [columnPinning.left, columnSizing])

  // Restrict drag to prevent crossing pinned/unpinned boundary
  const restrictToSection: Modifier = useCallback(
    ({ transform, activeNodeRect, draggingNodeRect, active }) => {
      if (activePinnedState === null || !activeNodeRect) return transform
      if (active?.data.current?.type && active.data.current.type !== 'column') return transform

      // Use cached boundary if available, otherwise calculate (fallback)
      let boundaryX = cachedBoundaryRef.current
      if (boundaryX === null) {
        const container = document.querySelector(`[${TABLE_CONTAINER_ATTR}]`)
        const containerLeft = container?.getBoundingClientRect().left ?? 0
        boundaryX = containerLeft + getPinnedSectionWidth()
      }

      const originalLeft = draggingNodeRect?.left ?? activeNodeRect.left

      if (activePinnedState) {
        // Pinned column can overlap slightly into unpinned section for better UX
        const rightEdge = originalLeft + activeNodeRect.width + transform.x
        const maxAllowedRight = boundaryX + DRAG_OVERLAP_ALLOWANCE
        if (rightEdge > maxAllowedRight) {
          return { ...transform, x: maxAllowedRight - originalLeft - activeNodeRect.width }
        }
      } else {
        // Unpinned column can overlap slightly into pinned section for better UX
        const leftEdge = originalLeft + transform.x
        const minAllowedLeft = boundaryX - DRAG_OVERLAP_ALLOWANCE
        if (leftEdge < minAllowedLeft) {
          return { ...transform, x: minAllowedLeft - originalLeft }
        }
      }
      return transform
    },
    [activePinnedState, getPinnedSectionWidth],
  )

  // Set pinned state when drag starts
  const setDragPinnedState = useCallback(
    (columnId: string | null) => {
      if (columnId === null) {
        setActivePinnedState(null)
        return
      }
      const isPinned = columnPinning.left?.includes(columnId) || false
      setActivePinnedState(isPinned)
    },
    [columnPinning.left],
  )

  // Clear pinned state and cached boundary
  const clearDragPinnedState = useCallback(() => {
    setActivePinnedState(null)
    cachedBoundaryRef.current = null
  }, [])

  // Set cached boundary position (called at drag start)
  const setCachedBoundary = useCallback((boundaryX: number) => {
    cachedBoundaryRef.current = boundaryX
  }, [])

  return {
    restrictToSection,
    setDragPinnedState,
    clearDragPinnedState,
    activePinnedState,
    setCachedBoundary,
  }
}
