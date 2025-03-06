import { useEffect, useMemo } from 'react'
import { Option, Filter } from './types'
import { SelectionData } from '@context/slicerContext'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'

type UseFocusOptions = {
  ref: React.RefObject<HTMLUListElement>
  options: Option[] | null
}

export const useFocusOptions = ({ ref, options }: UseFocusOptions) => {
  // map all ids into a string to be used to compare different dropdowns
  const ids = options?.map((option) => option.id)

  useEffect(() => {
    if (!ids) return
    // focus search input
    ref.current?.querySelector('input')?.focus()
  }, [ref, ids?.join('_')])
}

interface UseFiltersWithHierarchyProps {
  sliceFilter: TaskFilterValue | null
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
