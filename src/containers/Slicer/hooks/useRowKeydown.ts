import { KeyboardEvent, MouseEvent, useCallback } from 'react'
import { Row } from '@tanstack/react-table'

type RowEvent = MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>

interface UseRowKeydownProps<T> {
  handleRowSelect: (event: RowEvent, row: Row<T>) => void
}

function useRowKeydown<T>({ handleRowSelect }: UseRowKeydownProps<T>) {
  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, row: Row<T>) => {
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
