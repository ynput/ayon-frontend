import { useMemo } from 'react'
import { Filter, FilterValue } from '@ynput/ayon-react-components'
import { RowSelectionState } from '@tanstack/react-table'

interface UseFiltersWithHierarchyProps {
  sliceFilter: FilterValue | null
  persistedHierarchySelection: RowSelectionState | null
  filters: Filter[]
  merge?: boolean
}

export const useFiltersWithHierarchy = ({
  sliceFilter,
  persistedHierarchySelection,
  filters,
  merge = true,
}: UseFiltersWithHierarchyProps) => {
  const filtersWithHierarchy = useMemo(() => {
    const buildHierarchyFilterOption = (hierarchy: RowSelectionState): Filter => ({
      id: 'hierarchy',
      label: 'Folder',
      type: 'list_of_strings',
      values: Object.keys(hierarchy)
        .filter((id) => hierarchy[id])
        .map((id) => ({ id, label: id })),
      isCustom: true,
      singleSelect: true,
      fieldType: 'folder',
      operator: 'OR',
      isReadonly: true,
    })

    if (sliceFilter && persistedHierarchySelection) {
      if (merge) {
        return [buildHierarchyFilterOption(persistedHierarchySelection), ...filters]
      } else {
        return [buildHierarchyFilterOption(persistedHierarchySelection)]
      }
    }
    return filters
  }, [sliceFilter, persistedHierarchySelection, filters])

  return filtersWithHierarchy
}
