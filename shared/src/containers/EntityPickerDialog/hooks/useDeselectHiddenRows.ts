import { useEffect } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { PickerEntityType, PickerSelection } from '../EntityPickerDialog'
import type { EntityPickerDataReturn } from './useGetEntityPickerData'

interface UseDeselectHiddenRowsProps {
  entityHierarchy: PickerEntityType[]
  entityData: EntityPickerDataReturn
  rowSelection: PickerSelection
  setEntityRowSelection: (selection: RowSelectionState, entityType: PickerEntityType) => void
}

// The loaded rows are the source of truth: a selected id that a search, a page
// or the reviewables switch removed from the results is dropped from the selection.
export const useDeselectHiddenRows = ({
  entityHierarchy,
  entityData,
  rowSelection,
  setEntityRowSelection,
}: UseDeselectHiddenRowsProps) => {
  useEffect(() => {
    for (const type of entityHierarchy) {
      // folders are always fully loaded and only filtered client side
      if (type === 'folder') continue

      const { data, isLoading } = entityData[type]
      if (isLoading) continue

      const selection = rowSelection[type] || {}
      const selectedIds = Object.keys(selection).filter((id) => selection[id])
      if (!selectedIds.length) continue

      const loadedIds = new Set(data.map((entity) => entity.id))
      const visibleIds = selectedIds.filter((id) => loadedIds.has(id))
      if (visibleIds.length === selectedIds.length) continue

      setEntityRowSelection(
        Object.fromEntries(visibleIds.map((id) => [id, true])) as RowSelectionState,
        type,
      )
    }
  }, [entityHierarchy, entityData, rowSelection, setEntityRowSelection])
}
