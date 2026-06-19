import { useEffect, useState } from 'react'

import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import { $Any } from '@types'
import { getProjectAccessSearchFilterBuilder } from './mappers'
import { Filter, SearchFilter, SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import { getProjectDisplayName } from '@shared/util'

type Props = {
  filters: $Any
  projects: $Any
  users: $Any
  onChange: $Any
  onSearchChange?: (text: string) => void
}

const ProjectUserAccessSearchFilterWrapper = ({
  filters: _filters,
  projects,
  users,
  onChange,
  onSearchChange,
}: Props) => {
  const { isLoading: isAccessGroupsLoading, data: accessGroups = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  const options = getProjectAccessSearchFilterBuilder({
    projects: projects.map((project: $Any) => ({
      id: project.name,
      label: getProjectDisplayName(project),
    })),
    users: users.map((user: $Any) => ({
      id: user.name,
      label: user.name,
      img: `/api/users/${user.name}/avatar`,
    })),
    accessGroups: isAccessGroupsLoading
      ? []
      : accessGroups!.map((accessGroup: $Any) => ({
          id: accessGroup.name,
          label: accessGroup.name,
        })),
  })

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(_filters)

  // update filters when _filters changes from outside, preserving any local search chip
  useEffect(() => {
    setFilters((prev) => {
      const searchChips = prev.filter((f) => f.id.startsWith(SEARCH_FILTER_ID))
      return [..._filters, ...searchChips]
    })
  }, [_filters])

  return (
    <SearchFilter
      options={options}
      filters={filters}
      onChange={setFilters}
      onFinish={(v) => {
        // Extract any global text-search filter and forward its text via onSearchChange.
        // Strip it from the committed filters so it is never persisted.
        const searchFilter = v.find((f: Filter) => f.id.startsWith(SEARCH_FILTER_ID))
        const searchText = searchFilter?.values?.[0]?.id ?? ''
        onSearchChange?.(searchText)
        onChange(v.filter((f: Filter) => !f.id.startsWith(SEARCH_FILTER_ID)))
      }}
      enableAutosuggestion={true}
      enableGlobalSearch={true}
      onSearchChange={(text, filter) => {
        // only fire for root-level (no active filter panel) searches
        if (!filter) onSearchChange?.(text)
      }}
    />
  )
}

export default ProjectUserAccessSearchFilterWrapper
