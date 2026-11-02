import { useCallback, useMemo } from 'react'
import {
  scopeIdsToFolders,
  useProjectDataContext,
  useSelectedFolders,
  useViewsContext,
} from '@shared/containers'
import type { TableGroupBy } from '@shared/containers'
import {
  useSelectedEntityIds,
  useSlicerContext,
  useSlicerPanelSelections,
} from '@shared/containers/Slicer'
import { useProjectFoldersContext } from '@shared/context'
import { useVPViewsContext } from '../vp-views/VPViewsContextInstance'
import type { VersionsDataSource } from './VPDataContext'

// The Products page's input to the versions data layer: its view (filter bar, grouping, sorting,
// columns) and its slicer. EntityTable builds the same input from its props instead.
export const useVPPageDataSource = (projectName: string): VersionsDataSource => {
  const { attribFields } = useProjectDataContext()
  const { getFolderIdsWithoutChildren, getChildFolderIds } = useProjectFoldersContext()
  const {
    filters,
    showProducts,
    onUpdateShowProducts,
    sorting,
    featuredVersionOrder,
    latestPerFolder,
    groupBy: groupById,
    columns,
  } = useVPViewsContext()
  const { isLoadingViews, resetWorkingView } = useViewsContext()
  const { setPinnedSlice } = useSlicerContext()

  const onResetView = useCallback(async () => {
    setPinnedSlice(null)
    await resetWorkingView()
  }, [resetWorkingView, setPinnedSlice])

  const groupBy: TableGroupBy | undefined = useMemo(
    () => (groupById ? { id: groupById, desc: columns.groupBy?.desc ?? false } : undefined),
    [groupById, columns.groupBy?.desc],
  )

  // SLICER
  const { sliceSelections, sliceFilters, isLicensePending } = useSlicerPanelSelections(attribFields)

  // Resolve entity list selections to IDs
  const {
    entityIds,
    rawEntityIds,
    parentMaps,
    isLoading: isResolvingListIds,
  } = useSelectedEntityIds({
    slices: sliceSelections,
    projectName,
  })

  // get selected folders from slicer
  const { selectedFolders: selectedSlicerFolderIds, folderScope } = useSelectedFolders({
    slices: sliceSelections,
    entityListFolderIds: entityIds.folderIds,
    getChildFolderIds,
  })
  const folderIds = useMemo(
    () => getFolderIdsWithoutChildren(selectedSlicerFolderIds),
    [selectedSlicerFolderIds, getFolderIdsWithoutChildren],
  )

  // list entities narrowed to the hierarchy panel's subtree
  const versionIds = useMemo(
    () => scopeIdsToFolders(entityIds.versionIds, parentMaps.versionFolderIds, folderScope),
    [entityIds.versionIds, parentMaps, folderScope],
  )
  const productIds = useMemo(
    () => scopeIdsToFolders(entityIds.productIds, parentMaps.productFolderIds, folderScope),
    [entityIds.productIds, parentMaps, folderScope],
  )
  const taskIds = useMemo(
    () => scopeIdsToFolders(rawEntityIds.taskIds, parentMaps.taskFolderIds, folderScope),
    [rawEntityIds.taskIds, parentMaps, folderScope],
  )

  return {
    filters,
    showProducts,
    onUpdateShowProducts,
    sorting,
    featuredVersionOrder,
    latestPerFolder,
    groupBy,
    columnVisibility: columns.columnVisibility || {},
    isLoadingViews,
    onResetView,
    sliceFilters,
    folderIds,
    versionIds,
    productIds,
    taskIds,
    isLoadingSlice: isLicensePending || isResolvingListIds,
  }
}
