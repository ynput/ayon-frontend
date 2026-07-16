import { useMemo } from 'react'

import {
  buildMetricTargets,
  shouldSkipColumnStats,
  useGetFolderColumnStatsQuery,
  useGetTaskColumnStatsQuery,
} from '@shared/api'
import {
  useColumnSettingsContext,
  useProjectDataContext,
  useScopedAttributeFields,
} from '@shared/containers/ProjectTreeTable'
import { useViewsContext } from '@shared/containers'
import { usePowerpack, useProjectContext } from '@shared/context'

interface UseProjectOverviewStatsParams {
  folderFilter?: string
  taskFilter?: string
  folderSearch?: string
  taskSearch?: string
  selectedFolders: string[]
  selectedTaskIds: string[]
  showHierarchy: boolean
}

export const useProjectOverviewStats = ({
  folderFilter,
  taskFilter,
  folderSearch,
  taskSearch,
  selectedFolders,
  selectedTaskIds,
  showHierarchy,
}: UseProjectOverviewStatsParams) => {
  const { projectName } = useProjectContext()
  const { attribFields } = useProjectDataContext()
  const { powerLicense } = usePowerpack()
  const { isLoadingViews } = useViewsContext()
  const {
    columnVisibility,
    defaultColumnVisibility,
    columnSummaries,
    columnSummaryScopes,
    groupByConfig,
  } = useColumnSettingsContext()
  const scopedAttribFields = useScopedAttributeFields({
    attribFields,
    allowedScopes: ['task', 'folder'],
  })

  const noSummaries = shouldSkipColumnStats(
    columnSummaries,
    columnSummaryScopes,
    columnVisibility,
    defaultColumnVisibility,
  )

  const folderTargets = useMemo(
    () =>
      buildMetricTargets({
        entity: 'folder',
        attribs: scopedAttribFields,
        columnVisibility,
        defaultColumnVisibility,
        columnSummaries,
        columnSummaryScopes,
      }),
    [
      scopedAttribFields,
      columnVisibility,
      defaultColumnVisibility,
      columnSummaries,
      columnSummaryScopes,
    ],
  )
  const taskTargets = useMemo(
    () =>
      buildMetricTargets({
        entity: 'task',
        attribs: scopedAttribFields,
        columnVisibility,
        defaultColumnVisibility,
        columnSummaries,
        columnSummaryScopes,
      }),
    [
      scopedAttribFields,
      columnVisibility,
      defaultColumnVisibility,
      columnSummaries,
      columnSummaryScopes,
    ],
  )

  const skip = !projectName || isLoadingViews || !powerLicense || noSummaries

  const folderQuery = useGetFolderColumnStatsQuery(
    {
      projectName,
      filter: folderFilter || undefined,
      taskFilter: taskFilter || undefined,
      search: folderSearch || undefined,
      [showHierarchy ? 'parentIds' : 'ids']: selectedFolders.length ? selectedFolders : undefined,
      targets: folderTargets,
      includeFolderChildren: true,
      hideEmptyFolders: groupByConfig?.showEmpty === false && !showHierarchy ? true : undefined,
    },
    { skip },
  )

  const taskQuery = useGetTaskColumnStatsQuery(
    {
      projectName,
      filter: taskFilter || undefined,
      folderFilter: folderFilter || undefined,
      search: taskSearch || undefined,
      folderIds: selectedFolders.length ? selectedFolders : undefined,
      taskIds: selectedTaskIds.length ? selectedTaskIds : undefined,
      targets: taskTargets,
    },
    { skip },
  )

  return {
    folderStats: folderQuery.data,
    taskStats: taskQuery.data,
    folderStatsLoading: folderQuery.isLoading,
    taskStatsLoading: taskQuery.isLoading,
    folderStatsError: folderQuery.error,
    taskStatsError: taskQuery.error,
    refetchFolderStats: folderQuery.refetch,
    refetchTaskStats: taskQuery.refetch,
    isUninitializedFolderStats: folderQuery.isUninitialized,
    isUninitializedTaskStats: taskQuery.isUninitialized,
  }
}
