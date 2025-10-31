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
}

function useRowKeydown<T>({ handleRowSelect, handleArrowNavigation }: UseRowKeydownProps<T>) {
  const handleRowKeyDown = useCallback(
    (event: RowKeyboardEvent, row: Row<T>) => {
      if (['Enter', ' '].includes(event.key)) {
        // prevent default to prevent scrolling
        event.preventDefault()
        // select row
        handleRowSelect(event, row)
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        // prevent default to prevent scrolling
        event.preventDefault()
        // navigate and select
        const direction = event.key === 'ArrowDown' ? 'down' : 'up'
        handleArrowNavigation?.(direction, row, event)
      }
    },
    [handleRowSelect, handleArrowNavigation],
  )

  return { handleRowKeyDown }
}

export default useRowKeydown
