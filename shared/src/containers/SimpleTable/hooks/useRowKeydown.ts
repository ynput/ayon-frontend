import { KeyboardEvent, useCallback } from 'react'
import { Row } from '@tanstack/react-table'

// More specific type for keyboard events on a row element
export type RowKeyboardEvent = KeyboardEvent<HTMLDivElement>

interface UseRowKeydownProps<T> {
  // Updated to use the more specific RowKeyboardEvent for clarity
  handleRowSelect: (event: RowKeyboardEvent, row: Row<T>) => void
  handleArrowNavigation?: (
    direction: 'up' | 'down',
    currentRow: Row<T>,
    event: RowKeyboardEvent,
  ) => void
  handleRename?: (event: RowKeyboardEvent, row: Row<T>) => void
}

function useRowKeydown<T>({
  handleRowSelect,
  handleArrowNavigation,
  handleRename,
}: UseRowKeydownProps<T>) {
  const handleRowKeyDown = useCallback(
    (event: RowKeyboardEvent, row: Row<T>) => {
      if (['Enter', ' '].includes(event.key)) {
        // prevent default to prevent scrolling
        event.preventDefault()
        // don't leak the key to global (e.g. overview) shortcut handlers
        event.stopPropagation()
        // select row
        handleRowSelect(event, row)
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        // prevent default to prevent scrolling
        event.preventDefault()
        // don't leak the key to global (e.g. overview) shortcut handlers
        event.stopPropagation()
        // navigate and select
        const direction = event.key === 'ArrowDown' ? 'down' : 'up'
        handleArrowNavigation?.(direction, row, event)
      } else if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey) {
        // prevent default and stop propagation to ensure the shortcut is handled correctly
        event.preventDefault()
        event.stopPropagation()
        handleRename?.(event, row)
      }
    },
    [handleRowSelect, handleArrowNavigation, handleRename],
  )

  return { handleRowKeyDown }
}

export default useRowKeydown
