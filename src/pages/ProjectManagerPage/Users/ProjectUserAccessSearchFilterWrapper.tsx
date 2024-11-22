import { useEffect, useState } from 'react'

import SearchFilter from '@components/SearchFilter/SearchFilter'
import { Filter } from '@components/SearchFilter/types'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import { $Any } from '@types'
import { getProjectAccessSearchFilterBuiler } from './mappers'



type Props = {
  filters: $Any,
  projects: $Any,
  users: $Any,
  onChange: $Any
}

const ProjectUserAccessSearchFilterWrapper = ({
  filters: _filters,
  projects,
  users,
  onChange,
}: Props) => {
  const { isLoading: isAccessGroupsLoading, data: accessGroups = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  const options = getProjectAccessSearchFilterBuiler({
    projects: projects.map((project: $Any) => ({ id: project.name, label: project.name })),
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

  // update filters when it changes
  useEffect(() => {
    setFilters(_filters)
  }, [_filters, setFilters])

  return (
    <SearchFilter
      options={options}
      filters={filters}
      disableSearch
      onChange={setFilters}
      onFinish={(v) => onChange(v)}
    />
  )
}

export default ProjectUserAccessSearchFilterWrapper
