import {
  GetGroupedVersionsListArgs,
  QueryFilter,
  useGetGroupedVersionsListQuery,
} from '@shared/api'
import { TableGroupBy, useProjectDataContext } from '@shared/containers'
import {
  ProjectTableModulesType,
  useGetEntityGroups,
  useGroupedPagination,
  useQueryArgumentChangeLoading,
} from '@shared/hooks'
import { getGroupByDataType } from '@shared/util'
import { useMemo } from 'react'
import { useVPViewsContext } from '../context/VPViewsContext'
import { QueryArguments } from '../context/VPDataContext'

type Props = {
  projectName: string
  versionFilters: QueryFilter
  modules: ProjectTableModulesType
  versionArguments: QueryArguments
}

const useVersionsGroupBy = ({ projectName, versionFilters, modules, versionArguments }: Props) => {
  const { attribFields } = useProjectDataContext()
  const { getGroupQueries, isLoading: isLoadingModules } = modules

  const { groupBy: groupById } = useVPViewsContext()

  const groupBy: TableGroupBy | undefined = groupById
    ? {
        id: groupById,
        desc: false,
      }
    : undefined

  // GET GROUPING
  const { groups } = useGetEntityGroups({
    groupBy,
    projectName,
    entityType: 'version',
  })

  const { pageCounts: groupPageCounts, incrementPageCount } = useGroupedPagination({
    groups,
  })

  // for grouped versions, we fetch all versions for each group
  // we do this by building a list of groups with filters for that group
  const groupByDataType = getGroupByDataType(groupBy, attribFields)

  // get group queries from powerpack
  const versionGroups: GetGroupedVersionsListArgs['groups'] = useMemo(() => {
    return groupBy && groups.length
      ? getGroupQueries?.({
          groups,
          taskGroups: groups, // deprecated, but keep for backward compatibility
          filters: versionFilters,
          groupBy,
          groupPageCounts,
        }) ?? []
      : []
  }, [groupBy, groups, groupPageCounts, groupByDataType, versionFilters, getGroupQueries])

  const queryArgs = {
    groups: versionGroups, // special groups argument that also include version filters
    projectName: versionArguments.projectName,
    productFilter: versionArguments.productFilter,
    taskFilter: versionArguments.taskFilter,
    sortBy: versionArguments.sortBy,
    desc: versionArguments.desc,
    folderIds: versionArguments.folderIds,
    featuredOnly: versionArguments.featuredOnly,
  }

  const {
    data: { versions = [] } = {},
    isFetching: isFetchingGroups,
    refetch: refetchGroupedVersions,
  } = useGetGroupedVersionsListQuery(queryArgs, {
    skip: !groupBy || !versionGroups.length || isLoadingModules,
  })

  const isLoading = useQueryArgumentChangeLoading(queryArgs, isFetchingGroups)

  return {
    groups,
    versions,
    isLoading,
    refetch: refetchGroupedVersions,
    incrementPageCount,
  }
}

export default useVersionsGroupBy
