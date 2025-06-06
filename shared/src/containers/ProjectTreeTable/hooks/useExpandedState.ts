import { useCallback } from 'react'
import { ExpandedState, functionalUpdate, OnChangeFn } from '@tanstack/react-table'

interface UseExpandedStateProps {
  expanded: ExpandedState
  setExpanded: (expanded: ExpandedState) => void
}

export const useExpandedState = ({ expanded, setExpanded }: UseExpandedStateProps) => {
  const updateExpanded: OnChangeFn<ExpandedState> = useCallback(
    (expandedUpdater) => {
      setExpanded(functionalUpdate(expandedUpdater, expanded))
    },
    [expanded, setExpanded],
  )

  // Get all expanded IDs
  // This is useful for checking which rows are expanded
  const expandedIds = Object.entries(expanded)
    .filter(([, isExpanded]) => isExpanded)
    .map(([id]) => id)

  const toggleExpanded = useCallback(
    (id: string) => {
      if (typeof expanded === 'boolean') return
      setExpanded({
        ...expanded,
        [id]: !expanded[id],
      })
    },
    [expanded, setExpanded],
  )

  return {
    updateExpanded,
    toggleExpanded,
    expandedIds,
  }
}
