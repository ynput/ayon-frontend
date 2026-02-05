import { useCallback, useState } from 'react'
import { type Modifier } from '@dnd-kit/core'
import { ColumnPinningState, ColumnSizingState } from '@tanstack/react-table'

interface UseColumnDragRestrictionProps {
  columnPinning: ColumnPinningState
  columnSizing: ColumnSizingState
}

// Data attribute used to identify the table container
export const TABLE_CONTAINER_ATTR = 'data-column-dnd-container'

// Allow unpinned columns to overlap into pinned section for better UX
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

  // Calculate boundary position (total width of pinned section)
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

      // Find the table container by data attribute
      const container = document.querySelector(`[${TABLE_CONTAINER_ATTR}]`)
      const containerLeft = container?.getBoundingClientRect().left ?? 0

      const boundaryX = containerLeft + getPinnedSectionWidth()
      const originalLeft = draggingNodeRect?.left ?? activeNodeRect.left

      if (activePinnedState) {
        // Pinned column can't go past boundary to the right
        const rightEdge = originalLeft + activeNodeRect.width + transform.x
        if (rightEdge > boundaryX) {
          return { ...transform, x: boundaryX - originalLeft - activeNodeRect.width }
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

  // Clear pinned state
  const clearDragPinnedState = useCallback(() => {
    setActivePinnedState(null)
  }, [])

  return {
    restrictToSection,
    setDragPinnedState,
    clearDragPinnedState,
    activePinnedState,
  }
}
