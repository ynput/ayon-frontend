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
import {
  isGroupId,
  GROUP_BY_ID,
} from '@shared/containers/ProjectTreeTable/hooks/useBuildGroupByTableData'
import { ExpandedState } from '@tanstack/react-table'

type Props = {
  projectName: string
  versionFilters: QueryFilter
  taskFilters: QueryFilter
  modules: ProjectTableModulesType
  versionArguments: QueryArguments
  expanded: ExpandedState
}

const useVersionsGroupBy = ({
  projectName,
  versionFilters,
  taskFilters,
  modules,
  versionArguments,
  expanded,
}: Props) => {
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

  // get expanded group values from the expanded state
  // group IDs are formatted as `_GROUP_<value>` so we extract the values
  const expandedGroupValues = useMemo(() => {
    return Object.entries(expanded)
      .filter(([, isExpanded]) => isExpanded)
      .filter(([id]) => isGroupId(id))
      .map(([id]) => id.slice(GROUP_BY_ID.length))
  }, [expanded])

  // get group queries from powerpack, filtered to only include expanded groups
  const groupFilters: GetGroupedVersionsListArgs['groups'] = useMemo(() => {
    if (!groupBy || !groups.length) return []

    const allGroupFilters =
      getGroupQueries?.({
        groups,
        taskGroups: groups, // deprecated, but keep for backward compatibility
        filters: groupById === 'taskType' ? taskFilters : versionFilters, // taskType is not natively supported for versions, so we use taskFilters here
        groupBy,
        groupPageCounts,
      }) ?? []

    // Only fetch versions for groups that are expanded
    return allGroupFilters.filter((group) => expandedGroupValues.includes(group.value))
  }, [
    groupBy,
    groups,
    groupPageCounts,
    groupByDataType,
    versionFilters,
    getGroupQueries,
    expandedGroupValues,
    groupById,
    taskFilters,
  ])

  const queryArgs = {
    groups: groupFilters, // special groups argument that also include version filters
    groupFilterKey: groupById === 'taskType' ? 'taskFilter' : 'versionFilter',
    projectName: versionArguments.projectName,
    productFilter: versionArguments.productFilter,
    taskFilter: versionArguments.taskFilter,
    versionFilter: versionArguments.versionFilter,
    sortBy: versionArguments.sortBy,
    desc: versionArguments.desc,
    folderIds: versionArguments.folderIds,
    featuredOnly: versionArguments.featuredOnly,
    hasReviewables: versionArguments.hasReviewables,
  }

  const {
    data: { versions = [] } = {},
    isFetching: isFetchingGroups,
    refetch: refetchGroupedVersions,
  } = useGetGroupedVersionsListQuery(queryArgs, {
    skip: !groupBy || !groupFilters.length || isLoadingModules,
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
