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
  isFlatFolderView?: boolean
  // hierarchy: selected folders are scope roots, only their descendants are rows
  excludeSelectedFolders?: boolean
}

export const useProjectOverviewStats = ({
  folderFilter,
  taskFilter,
  folderSearch,
  taskSearch,
  selectedFolders,
  selectedTaskIds,
  showHierarchy,
  isFlatFolderView = false,
  excludeSelectedFolders = true,
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

  // Folder rows (hierarchy, flat folders view) come from the REST folder search
  // (useFetchOverviewData), so send the same filters: the text search matches folders or their
  // tasks (globalSearch) and the hierarchy also shows the parents of the matches (includeParents).
  // The task list has no folder rows, there the folders of the filtered tasks are counted.
  const isHierarchy = showHierarchy && !isFlatFolderView
  const hasFolderRows = showHierarchy || isFlatFolderView
  const scopeToDescendants = isHierarchy && excludeSelectedFolders
  const folderStatsArgs: GetFolderColumnStatsQueryVariables = {
    projectName,
    filter: folderFilter || undefined,
    taskFilter: taskFilter || undefined,
    ...(hasFolderRows
      ? { globalSearch: taskSearch || undefined }
      : { search: folderSearch || undefined, taskSearch: taskSearch || undefined }),
    includeParents: isHierarchy || undefined,
    [scopeToDescendants ? 'parentIds' : 'ids']: selectedFolderIdsWithoutChildren.length
      ? selectedFolderIdsWithoutChildren
      : undefined,
    targets: folderTargets,
    includeFolderChildren: true,
    hideEmptyFolders: isFlatFolderView && groupByConfig?.showEmpty === false ? true : undefined,
  }

  const folderQuery = useGetFolderColumnStatsQuery(folderStatsArgs, { skip })

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
