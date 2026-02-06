import { useLayoutEffect, useMemo, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Column, ColumnOrderState, ColumnSizingState } from '@tanstack/react-table'
import { TableRow } from '../types/table'
import { throttle } from 'lodash'
import { useDndMonitor } from '@dnd-kit/core'

interface UseColumnVirtualizationProps {
  visibleColumns: Column<TableRow, unknown>[]
  tableContainerRef: React.RefObject<HTMLDivElement>
  columnPinning: {
    left?: string[]
  }
  columnSizing: ColumnSizingState
  columnOrder: ColumnOrderState
}

interface UseColumnVirtualizationResult {
  columnVirtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, HTMLTableCellElement>>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
}

const useColumnVirtualization = ({
  visibleColumns,
  tableContainerRef,
  columnPinning,
  columnSizing,
  columnOrder,
}: UseColumnVirtualizationProps): UseColumnVirtualizationResult => {
  // Extract pinned column indexes for virtualization
  const leftPinnedIndexes = useMemo(() => {
    return visibleColumns.filter((col) => col.getIsPinned() === 'left').map((col) => col.getIndex())
  }, [visibleColumns, columnPinning])
  const [activeColumnIndex, setActiveColumnIndex] = useState<number | null>(null)

  useDndMonitor({
    onDragStart(event) {
      if (event.active.data?.current?.type === 'column') {
        const idx = visibleColumns.findIndex((col) => col.id === event.active.id)
        if (idx !== -1) setActiveColumnIndex(idx)
      }
    },
    onDragEnd() {
      setActiveColumnIndex(null)
    },
    onDragCancel() {
      setActiveColumnIndex(null)
    },
  })

  // Find highest pinned index and include all columns between 0 and that index
  const pinnedColumnIndexes: number[] = []
  if (leftPinnedIndexes.length > 0) {
    const maxPinnedIndex = Math.max(...leftPinnedIndexes)
    // Include all indexes from 0 to maxPinnedIndex to maintain continuity
    for (let i = 0; i <= maxPinnedIndex; i++) {
      pinnedColumnIndexes.push(i)
    }
  }

  const columnVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableCellElement>({
    count: visibleColumns.length,
    estimateSize: (index) => visibleColumns[index].getSize(), //estimate width of each column for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 1, //how many columns to render on each side off screen each way (adjust this for performance)
    rangeExtractor: (range) => {
      const start = range.startIndex
      const end = range.endIndex
      const overscan = range.overscan

      // Calculate the base visible range with overscan
      const baseIndexes = []
      for (let i = start - overscan; i <= end + overscan; i++) {
        if (i >= 0 && i < visibleColumns.length) {
          baseIndexes.push(i)
        }
      }

      // Create a Set of all unique indexes we need to render
      const allIndexes = new Set([
        ...pinnedColumnIndexes, // All columns up to the highest pinned column
        ...baseIndexes, // Visible columns in the current range
        ...(activeColumnIndex !== null && activeColumnIndex !== -1 ? [activeColumnIndex] : []),
      ])

      // Sort indexes to maintain column order
      return Array.from(allIndexes).sort((a, b) => a - b)
    },
  })

  const throttledMeasure = useMemo(
    () =>
      throttle(() => {
        columnVirtualizer.measure()
      }, 1000),
    [columnVirtualizer],
  )

  // HACK: we must remeasure the column widths when the column sizing or ordering changes
  useLayoutEffect(() => {
    throttledMeasure()
  }, [throttledMeasure, columnSizing, columnOrder])

  const virtualColumnsResult = columnVirtualizer.getVirtualItems()

  // Calculate virtual padding differently for pinned columns
  let virtualPaddingLeft: number | undefined
  let virtualPaddingRight: number | undefined

  if (columnVirtualizer && virtualColumnsResult.length) {
    const totalSize = columnVirtualizer.getTotalSize()

    // Find the first non-pinned visible column
    const firstNonPinnedIndex = virtualColumnsResult.findIndex(
      (vc) => !pinnedColumnIndexes.includes(vc.index),
    )

    if (firstNonPinnedIndex !== -1) {
      // Calculate left padding by finding the start of the first non-pinned column
      // minus the total width of all pinned columns that come before it
      const firstNonPinnedStart = virtualColumnsResult[firstNonPinnedIndex].start
      const totalPinnedWidth = pinnedColumnIndexes.reduce((width, index) => {
        const col = visibleColumns[index]
        return width + col.getSize()
      }, 0)

      // Adjust left padding to account for pinned columns
      virtualPaddingLeft = Math.max(0, firstNonPinnedStart - totalPinnedWidth)
    } else {
      virtualPaddingLeft = 0
    }

    // Last column's end position
    const lastVisibleColumnEnd = virtualColumnsResult[virtualColumnsResult.length - 1]?.end ?? 0

    // Calculate right padding
    virtualPaddingRight = Math.max(0, totalSize - lastVisibleColumnEnd)
  }

  return {
    columnVirtualizer,
    virtualPaddingLeft,
    virtualPaddingRight,
  }
}

export default useColumnVirtualization
