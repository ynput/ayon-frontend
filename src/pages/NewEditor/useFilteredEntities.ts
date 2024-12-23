import { useMemo } from "react"
import { mapQueryFilters } from "./mappers"
import { useGetFilteredEntitiesQuery } from "@queries/overview/getFilteredEntities"
import { $Any } from "@types"
import { useSelector } from "react-redux"
import { Filter } from "@components/SearchFilter/types"
import { TaskFilterValue } from "@containers/TasksProgress/hooks/useFilterBySlice"

  const useFilteredEntities = ({
    filters,
    sliceFilter,
    selectedPaths,
  }: {
    filters: Filter[]
    sliceFilter: TaskFilterValue | null
    selectedPaths: string[]
  }) => {
    const projectName = useSelector((state: $Any) => state.project.name)

    // build the graphql query filters based on the search filters and slice selection
    const queryFilters = useMemo(
      () => mapQueryFilters({ filters, sliceFilter, selectedPaths }),
      [filters, sliceFilter, selectedPaths],
    )
    console.log('queryFilters: ', queryFilters)

    const entities = useGetFilteredEntitiesQuery({ projectName, ...queryFilters })
    console.log(entities)

    return { filteredEntities: entities }
  }

  export default useFilteredEntities