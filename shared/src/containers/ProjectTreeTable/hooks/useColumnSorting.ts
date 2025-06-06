import { useCallback } from 'react'
import { SortingState, functionalUpdate, OnChangeFn } from '@tanstack/react-table'

interface UseColumnSortingProps {
  updatePageConfig: (config: { columnSorting: SortingState }) => Promise<void>
  columnSorting: SortingState
}

export const useColumnSorting = ({ updatePageConfig, columnSorting }: UseColumnSortingProps) => {
  const setColumnSorting = useCallback(
    async (sorting: SortingState) => {
      await updatePageConfig({ columnSorting: sorting })
    },
    [updatePageConfig],
  )

  const updateSorting: OnChangeFn<SortingState> = useCallback(
    (sortingUpdater) => {
      setColumnSorting(functionalUpdate(sortingUpdater, columnSorting))
    },
    [setColumnSorting, columnSorting],
  )

  return {
    setColumnSorting,
    updateSorting,
  }
}
