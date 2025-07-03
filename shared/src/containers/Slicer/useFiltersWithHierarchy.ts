import { useMemo } from 'react'
import { Filter, FilterValue } from '@ynput/ayon-react-components'
import { SelectionData } from '@shared/containers/Slicer'

interface UseFiltersWithHierarchyProps {
  sliceFilter: FilterValue | null
  persistedHierarchySelection: SelectionData | null
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
    const buildHierarchyFilterOption = (hierarchy: SelectionData): Filter => ({
      id: 'hierarchy',
      label: 'Folder',
      type: 'list_of_strings',
      values: Object.values(hierarchy).map((item) => ({
        id: item.id,
        label: item.label || item.name || item.id,
      })),
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
