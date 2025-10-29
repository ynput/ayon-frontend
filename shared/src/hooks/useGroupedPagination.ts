import { useEffect, useMemo, useState } from 'react'
import type { EntityGroup } from '@shared/api'

type UseGroupedPaginationProps = {
  groups: EntityGroup[]
}

type UseGroupedPaginationReturn = {
  pageCounts: Record<string, number>
  setPageCounts: (counts: Record<string, number>) => void
  incrementPageCount: (groupValue: string) => void
}

/**
 * Generic hook for managing pagination state across grouped entities.
 * Initializes page counts for each group and provides methods to update them.
 *
 * Works with any entity type (tasks, assets, shots, etc.) that uses EntityGroup.
 *
 * @param groups - Array of entity groups
 * @returns Object containing pageCounts, setPageCounts, and incrementPageCount
 *
 * @example
 * const { pageCounts, incrementPageCount } = useGroupedPagination({ groups: entityGroups })
 * // Later, fetch next page for a specific group
 * incrementPageCount('groupValue')
 */
export const useGroupedPagination = ({
  groups,
}: UseGroupedPaginationProps): UseGroupedPaginationReturn => {
  // Initialize page counts based on groups
  const initPageCounts = useMemo(() => {
    return groups.reduce((acc, group) => {
      acc[group.value] = 1 // initialize each group with page 1
      return acc
    }, {} as Record<string, number>)
  }, [groups])

  const [pageCounts, setPageCounts] = useState<Record<string, number>>({})

  // When initPageCounts changes, sync it to pageCounts if pageCounts is empty
  useEffect(() => {
    const hasInitData = Object.keys(initPageCounts).length > 0
    const hasCurrentData = Object.keys(pageCounts).length > 0

    if (hasInitData && !hasCurrentData) {
      setPageCounts(initPageCounts)
    }
  }, [initPageCounts, pageCounts])

  const incrementPageCount = (groupValue: string) => {
    setPageCounts((prevCounts) => {
      const newCounts = { ...prevCounts }
      newCounts[groupValue] = (newCounts[groupValue] || 1) + 1
      return newCounts
    })
  }

  return {
    pageCounts,
    setPageCounts,
    incrementPageCount,
  }
}
