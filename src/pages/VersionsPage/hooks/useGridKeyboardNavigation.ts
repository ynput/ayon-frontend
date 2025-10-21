import { useCallback, useEffect, RefObject, useRef } from 'react'
import { getCellId, parseCellId } from '@shared/containers/ProjectTreeTable/utils/cellUtils'

interface UseGridKeyboardNavigationProps {
  gridData: Array<{ id: string; entityType: string }>
  selectedCells: Set<string>
  setSelectedCells: (cells: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  setFocusedCellId: (cellId: string) => void
  gridContainerRef: RefObject<HTMLDivElement>
  onEnterPress?: (entityId: string) => void
  gridColumnId?: string
  rowSelectionColumnId?: string
}

export const useGridKeyboardNavigation = ({
  gridData,
  selectedCells,
  setSelectedCells,
  setFocusedCellId,
  gridContainerRef,
  onEnterPress,
  gridColumnId = 'name',
  rowSelectionColumnId = 'rowSelection',
}: UseGridKeyboardNavigationProps) => {
  // Track the anchor point for shift selections
  const shiftAnchorIndexRef = useRef<number | null>(null)
  // Track the current position (where the user navigated to last)
  const currentPositionRef = useRef<number | null>(null)

  const calculateColumnsCount = useCallback(() => {
    if (!gridContainerRef.current) return 1

    const container = gridContainerRef.current
    const gridItems = container.querySelectorAll('.grid-item')
    if (gridItems.length < 2) return 1

    // Get the left position of the first two items
    const firstItemLeft = gridItems[0].getBoundingClientRect().left
    const secondItemLeft = gridItems[1].getBoundingClientRect().left

    // If they're on the same row, count how many items fit
    if (Math.abs(firstItemLeft - secondItemLeft) > 10) {
      // Different positions, so they're in different columns
      let columns = 1
      const firstTop = gridItems[0].getBoundingClientRect().top

      for (let i = 1; i < gridItems.length; i++) {
        const itemTop = gridItems[i].getBoundingClientRect().top
        if (Math.abs(itemTop - firstTop) < 10) {
          columns++
        } else {
          break
        }
      }
      return columns
    }

    return 1
  }, [gridContainerRef])

  const getCurrentIndex = useCallback(() => {
    // Find the first selected cell and get its index
    const selectedArray = Array.from(selectedCells)
    if (selectedArray.length === 0) return -1

    // Extract entity ID from the cell ID (format: "cell-entityId-columnId")
    // Try each selected cell until we find a match
    for (const cellId of selectedArray) {
      const entityId = parseCellId(cellId)?.rowId

      const index = gridData.findIndex((item) => item.id === entityId)
      if (index !== -1) return index
    }

    return -1
  }, [selectedCells, gridData])

  const selectItem = useCallback(
    (index: number, shiftKey: boolean, columnId: string = gridColumnId) => {
      if (index < 0 || index >= gridData.length) return

      const entityId = gridData[index].id
      const cellId = getCellId(entityId, columnId)

      // Check if we have any row selections
      const hasRowSelection = Array.from(selectedCells).some((id) =>
        id.includes(rowSelectionColumnId),
      )

      if (shiftKey) {
        // Shift+arrow: extend selection from anchor
        // If no anchor is set, use the current position
        if (shiftAnchorIndexRef.current === null) {
          const current = currentPositionRef.current ?? getCurrentIndex()
          shiftAnchorIndexRef.current = current !== -1 ? current : index
        }

        // Select range from anchor to target
        const start = Math.min(shiftAnchorIndexRef.current, index)
        const end = Math.max(shiftAnchorIndexRef.current, index)
        const newSelection = new Set<string>()

        for (let i = start; i <= end; i++) {
          const id = gridData[i]?.id
          if (id) {
            newSelection.add(getCellId(id, columnId))
            if (hasRowSelection || columnId === rowSelectionColumnId) {
              newSelection.add(getCellId(id, gridColumnId))
              newSelection.add(getCellId(id, rowSelectionColumnId))
            }
          }
        }
        setSelectedCells(newSelection)
        // Update current position but keep anchor
        currentPositionRef.current = index
      } else {
        // Normal arrow: select only this item and reset anchor
        shiftAnchorIndexRef.current = index
        currentPositionRef.current = index
        const newSelection = new Set([cellId])
        if (hasRowSelection || columnId === rowSelectionColumnId) {
          newSelection.add(getCellId(entityId, gridColumnId))
          newSelection.add(getCellId(entityId, rowSelectionColumnId))
        }
        setSelectedCells(newSelection)
      }

      setFocusedCellId(cellId)

      // Scroll the item into view
      const gridItems = gridContainerRef.current?.querySelectorAll('.grid-item')
      if (gridItems && gridItems[index]) {
        gridItems[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    },
    [
      gridData,
      selectedCells,
      setSelectedCells,
      setFocusedCellId,
      getCurrentIndex,
      gridContainerRef,
      gridColumnId,
      rowSelectionColumnId,
    ],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only handle if we're in the grid container
      const container = gridContainerRef.current
      if (!container) return

      // Check if the grid container itself is focused or any of its children
      const isGridFocused =
        document.activeElement === container || container.contains(document.activeElement)
      if (!isGridFocused) return

      // Use current position if available, otherwise get from selection
      let currentIndex = currentPositionRef.current
      if (currentIndex === null) {
        currentIndex = getCurrentIndex()
        currentPositionRef.current = currentIndex
      }

      if (currentIndex === -1 && !['ArrowDown', 'ArrowRight', 'Home'].includes(e.key)) return

      const columnsCount = calculateColumnsCount()

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          if (currentIndex >= columnsCount) {
            selectItem(currentIndex - columnsCount, e.shiftKey)
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (currentIndex === -1) {
            // No selection, select first item
            selectItem(0, false)
          } else if (currentIndex + columnsCount < gridData.length) {
            selectItem(currentIndex + columnsCount, e.shiftKey)
          }
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (currentIndex > 0) {
            selectItem(currentIndex - 1, e.shiftKey)
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (currentIndex === -1) {
            // No selection, select first item
            selectItem(0, false)
          } else if (currentIndex < gridData.length - 1) {
            selectItem(currentIndex + 1, e.shiftKey)
          }
          break

        case 'Enter':
          e.preventDefault()
          if (currentIndex !== -1 && onEnterPress) {
            const entityId = gridData[currentIndex].id
            onEnterPress(entityId)
          }
          break

        case 'Home':
          e.preventDefault()
          selectItem(0, e.shiftKey)
          break

        case 'End':
          e.preventDefault()
          selectItem(gridData.length - 1, e.shiftKey)
          break
      }
    },
    [
      gridData,
      getCurrentIndex,
      selectItem,
      calculateColumnsCount,
      gridContainerRef,
      onEnterPress,
      rowSelectionColumnId,
    ],
  )

  useEffect(() => {
    const container = gridContainerRef.current
    if (!container) return

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, gridContainerRef])

  // Reset position tracking when selection changes externally (e.g., mouse click)
  const resetPositionTracking = useCallback(() => {
    shiftAnchorIndexRef.current = null
    currentPositionRef.current = null
  }, [])

  return { handleKeyDown, resetPositionTracking }
}
