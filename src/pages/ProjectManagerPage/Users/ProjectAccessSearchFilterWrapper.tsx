import SearchFilter from '@components/SearchFilter/SearchFilter'
import { Filter } from '@components/SearchFilter/types'
import { useEffect, useState } from 'react'
import { useProjectAccessSearchFilterBuiler } from './hooks'
import { $Any } from '@types'
import { useListProjectsQuery } from '@queries/project/getProject'
import { useGetAccessGroupsQuery } from '@queries/accessGroups/getAccessGroups'
import { useSelector } from 'react-redux'
import { useGetUsersQuery } from '@queries/user/getUsers'

type Props = {
  filters: $Any,
  onChange: $Any
}

const ProjectAccessSearchFilterWrapper = ({ filters: _filters, onChange }: Props) => {
  const selfName = useSelector((state: $Any) => state.user.name)
  const { isLoading: isProjectsLoading, data: projects = [] } = useListProjectsQuery({})
  const { isLoading: isUsersLoading, data: users = [] } = useGetUsersQuery({ selfName })
  const { isLoading: isAccessGroupsLoading, data: accessGroups = [] } = useGetAccessGroupsQuery({
    projectName: '_',
  })

  const options = useProjectAccessSearchFilterBuiler({
    projects: isProjectsLoading
      ? []
      // @ts-ignore
      : projects.map((project: $Any) => ({ id: project.name, label: project.name })),
    users: isUsersLoading ? [] : users.map((user: $Any) => ({ id: user.name, label: user.name, img: `/api/users/${user.name}/avatar` })),
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

export default ProjectAccessSearchFilterWrapper
