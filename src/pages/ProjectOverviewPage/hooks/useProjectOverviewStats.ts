import { useMemo } from 'react'

import {
  buildMetricTargets,
  GetFolderColumnStatsQueryVariables,
  GetTaskColumnStatsQueryVariables,
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
import { usePowerpack, useProjectContext, useProjectFoldersContext } from '@shared/context'

interface UseProjectOverviewStatsParams {
  folderFilter?: string
  taskFilter?: string
  folderSearch?: string
  taskSearch?: string
  selectedFolders: string[]
  selectedTaskIds: string[]
  showHierarchy: boolean
  // The folders of the table data (hierarchy, flat folders view); the folder summary aggregates
  // exactly these. null when that is every folder of the project, undefined when the table shows
  // no folder rows (task list), where the folders are derived from the filters.
  tableFolderIds?: string[] | null
  // the table's folder set is still loading, so tableFolderIds is not final yet
  isLoadingTableFolders?: boolean
}

export const useProjectOverviewStats = ({
  folderFilter,
  taskFilter,
  folderSearch,
  taskSearch,
  selectedFolders,
  selectedTaskIds,
  showHierarchy,
  tableFolderIds,
  isLoadingTableFolders,
}: UseProjectOverviewStatsParams) => {
  const { projectName } = useProjectContext()
  const { attribFields } = useProjectDataContext()
  const { powerLicense } = usePowerpack()
  const { isLoadingViews } = useViewsContext()
  const { getFolderIdsWithoutChildren } = useProjectFoldersContext()
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

  const selectedFolderIdsWithoutChildren = useMemo(
    () => getFolderIdsWithoutChildren(selectedFolders),
    [selectedFolders, getFolderIdsWithoutChildren],
  )

  // The table data already applies every filter, search and selection to its folders, including
  // parents of matches (hierarchy) and folders without tasks (flat folders view), which the
  // filter arguments alone can't express, so count those folders directly.
  const folderStatsArgs: GetFolderColumnStatsQueryVariables =
    tableFolderIds === null
      ? { projectName, targets: folderTargets, includeFolderChildren: true }
      : tableFolderIds
      ? {
          projectName,
          ids: tableFolderIds,
          includeFolderChildren: false,
          targets: folderTargets,
        }
      : {
          projectName,
          filter: folderFilter || undefined,
          search: folderSearch || undefined,
          taskFilter: taskFilter || undefined,
          taskSearch: taskSearch || undefined,
          [showHierarchy ? 'parentIds' : 'ids']: selectedFolderIdsWithoutChildren.length
            ? selectedFolderIdsWithoutChildren
            : undefined,
          targets: folderTargets,
          includeFolderChildren: true,
          hideEmptyFolders: groupByConfig?.showEmpty === false && !showHierarchy ? true : undefined,
        }

  const folderQuery = useGetFolderColumnStatsQuery(folderStatsArgs, {
    skip: skip || isLoadingTableFolders,
  })

  const taskStatsArgs: GetTaskColumnStatsQueryVariables = {
    projectName,
    filter: taskFilter || undefined,
    folderFilter: folderFilter || undefined,
    search: taskSearch || undefined,
    folderIds: selectedFolderIdsWithoutChildren.length
      ? selectedFolderIdsWithoutChildren
      : undefined,
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
