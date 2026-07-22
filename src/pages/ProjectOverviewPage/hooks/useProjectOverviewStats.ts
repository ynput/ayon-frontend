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
  applySliceSummaryDefault,
} from '@shared/containers/ProjectTreeTable'
import { useViewsContext, useSlicerContext } from '@shared/containers'
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

  // active slicer auto-enables its matching column's default summary
  const { sliceType } = useSlicerContext()
  const effectiveColumnSummaries = useMemo(
    () => applySliceSummaryDefault(columnSummaries, columnSummaryScopes, sliceType),
    [columnSummaries, columnSummaryScopes, sliceType],
  )

  const noSummaries = shouldSkipColumnStats(
    effectiveColumnSummaries,
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
        columnSummaries: effectiveColumnSummaries,
        columnSummaryScopes,
      }),
    [
      scopedAttribFields,
      columnVisibility,
      defaultColumnVisibility,
      effectiveColumnSummaries,
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
        columnSummaries: effectiveColumnSummaries,
        columnSummaryScopes,
      }),
    [
      scopedAttribFields,
      columnVisibility,
      defaultColumnVisibility,
      effectiveColumnSummaries,
      columnSummaryScopes,
    ],
  )

  const skip = !projectName || isLoadingViews || !powerLicense || noSummaries

  const folderStatsArgs = {
    projectName,
    filter: folderFilter || undefined,
    taskFilter: taskFilter || undefined,
    search: folderSearch || undefined,
    [showHierarchy ? 'parentIds' : 'ids']: selectedFolders.length ? selectedFolders : undefined,
    targets: folderTargets,
    includeFolderChildren: true,
    hideEmptyFolders: groupByConfig?.showEmpty === false && !showHierarchy ? true : undefined,
  }

  const folderQuery = useGetFolderColumnStatsQuery(folderStatsArgs, { skip })

  const taskStatsArgs = {
    projectName,
    filter: taskFilter || undefined,
    folderFilter: folderFilter || undefined,
    search: taskSearch || undefined,
    folderIds: selectedFolders.length ? selectedFolders : undefined,
    taskIds: selectedTaskIds.length ? selectedTaskIds : undefined,
    targets: taskTargets,
  }

  const taskQuery = useGetTaskColumnStatsQuery(taskStatsArgs, { skip })

  return {
    folderStats: folderQuery.data,
    taskStats: taskQuery.data,
    folderStatsLoading: folderQuery.isLoading,
    taskStatsLoading: taskQuery.isLoading,
    folderStatsError: folderQuery.error,
    taskStatsError: taskQuery.error,
    folderStatsArgs,
    taskStatsArgs,
    isUninitializedFolderStats: folderQuery.isUninitialized,
    isUninitializedTaskStats: taskQuery.isUninitialized,
  }
}
