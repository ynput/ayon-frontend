import { KeyboardEvent, useCallback } from 'react'
import { Row } from '@tanstack/react-table'

// More specific type for keyboard events on a row element
export type RowKeyboardEvent = KeyboardEvent<HTMLDivElement>

interface UseRowKeydownProps<T> {
  // Updated to use the more specific RowKeyboardEvent for clarity
  handleRowSelect: (event: RowKeyboardEvent, row: Row<T>) => void
}

function useRowKeydown<T>({ handleRowSelect }: UseRowKeydownProps<T>) {
  const handleRowKeyDown = useCallback(
    (event: RowKeyboardEvent, row: Row<T>) => {
      if (['Enter', ' '].includes(event.key)) {
        // prevent default to prevent scrolling
        event.preventDefault()
        // select row
        handleRowSelect(event, row)
      }
    },
    [handleRowSelect],
  )

  return { handleRowKeyDown }
}

export default useRowKeydown
