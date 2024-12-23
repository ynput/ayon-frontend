import { Filter } from '@components/SearchFilter/types'
import formatSearchQueryFilters, { FilterQueriesData } from '@containers/TasksProgress/helpers/formatSearchQueryFilters'
import { TaskFilterValue } from '@containers/TasksProgress/hooks/useFilterBySlice'
import { $Any } from '@types'

const getAbsoluteSelections = (selections: $Any) =>
  selections.map((selection: $Any) => ({
    start: [
      Math.min(selection?.start?.[0] || -1, selection.end?.[0] || -1),
      Math.min(selection?.start?.[1] || -1, selection.end?.[1] || -1),
    ],
    end: [
      Math.max(selection?.start?.[0] || -1, selection.end?.[0] || -1),
      Math.max(selection?.start?.[1] || -1, selection.end?.[1] || -1),
    ],
  })) as Selection[]

const isSelected = (absoluteSelections: $Any, x: number, y: number) => {
  for (const selection of absoluteSelections) {
    if (selection.start === undefined || selection.end === undefined) {
      continue
    }
    if (
      selection.start[0] <= x &&
      x <= selection.end[0] &&
      selection.start[1] <= y &&
      y <= selection.end[1]
    ) {
      return true
    }
  }

  return false
}
type QueryFiltersParams = {
  filters: Filter[],
  sliceFilter: TaskFilterValue | null,
  selectedPaths: string[]
}
const mapQueryFilters = ({filters, sliceFilter, selectedPaths = []}: QueryFiltersParams) => {
    const queryFilters = formatSearchQueryFilters(filters, sliceFilter) as FilterQueriesData  & {pathEx: string}
    console.log('paths: ', selectedPaths)
    if (selectedPaths.length > 0) {
      queryFilters.pathEx = selectedPaths.join('|')
    }

    return queryFilters
}

export { getAbsoluteSelections, isSelected, mapQueryFilters }
