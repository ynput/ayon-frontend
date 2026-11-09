import { useEffect, useRef } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { PickerEntityType, PickerSelection } from '../EntityPickerDialog'
import type { EntityPickerDataReturn } from './useGetEntityPickerData'

interface UseDeselectHiddenRowsProps {
  entityHierarchy: PickerEntityType[]
  entityData: EntityPickerDataReturn
  rowSelection: PickerSelection
  setEntityRowSelection: (selection: RowSelectionState, entityType: PickerEntityType) => void
  initialSelection?: Partial<PickerSelection>
}

const selectedIdsOf = (selection: RowSelectionState = {}) =>
  Object.keys(selection).filter((id) => selection[id])

// The loaded rows are the source of truth: a selected id that a search, a page
// or the reviewables switch removed from the results is dropped from the selection.
// The exception is the initial selection: an id that isn't loaded yet stays selected
// while a page of its type, or of a type above it, can still bring it in.
export const useDeselectHiddenRows = ({
  entityHierarchy,
  entityData,
  rowSelection,
  setEntityRowSelection,
  initialSelection,
}: UseDeselectHiddenRowsProps) => {
  // the initial ids that aren't loaded yet, by type; set on the first run
  const waitingRef = useRef<Partial<Record<PickerEntityType, Set<string>>> | null>(null)

  useEffect(() => {
    const waiting = (waitingRef.current ??= Object.fromEntries(
      entityHierarchy.map((type) => [type, new Set(selectedIdsOf(initialSelection?.[type]))]),
    ))

    for (const type of entityHierarchy) {
      // folders are always fully loaded and only filtered client side
      if (type === 'folder') continue

      const { data, isLoading } = entityData[type]
      if (isLoading) continue

      const selection = rowSelection[type] || {}
      const selectedIds = selectedIdsOf(selection)
      const loadedIds = new Set(data.map((entity) => entity.id))

      // an initial id stops waiting once it has loaded, or once the user deselected it
      const waitingIds = waiting[type] ?? new Set<string>()
      for (const id of waitingIds) {
        if (loadedIds.has(id) || !selection[id]) waitingIds.delete(id)
      }

      if (!selectedIds.length) continue

      // pages left to load in this type or in the ones above it (folders have none)
      const pagesLeft = entityHierarchy
        .slice(0, entityHierarchy.indexOf(type) + 1)
        .some((t) => entityData[t].hasNextPage || entityData[t].isFetchingNextPage)

      const keptIds = selectedIds.filter(
        (id) => loadedIds.has(id) || (waitingIds.has(id) && pagesLeft),
      )
      if (keptIds.length === selectedIds.length) continue

      setEntityRowSelection(
        Object.fromEntries(keptIds.map((id) => [id, true])) as RowSelectionState,
        type,
      )
    }
  }, [entityHierarchy, entityData, rowSelection, setEntityRowSelection, initialSelection])
}
