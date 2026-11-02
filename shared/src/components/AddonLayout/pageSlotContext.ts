// The contexts of the project.page and studio.page slots (@ynput/ayon-addon), built from the host's
// providers around a page: ProjectFoldersContextProvider, SlicerProvider and ViewsProvider. Used by
// the app's AddonPages and by the standalone dev shell, so both pass the same context.
import { useCallback, useMemo } from 'react'
import type { RowSelectionState } from '@tanstack/react-table'
import type { FolderInfo, PageSlicer, PageViews, ProjectFolders, SlotMap } from '@ynput/ayon-addon'
import { useGetProjectQuery } from '@shared/api'
import { useSlicerContext } from '@shared/containers/Slicer'
import { useViewsContext } from '@shared/containers/Views/context/ViewsContextInstance'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import { useProjectFoldersContext } from '@shared/context/project-folders/ProjectFoldersContextInstance'

// the page keeps no local copy of the settings, so there is no local state to set or revert
const noLocalState = () => undefined

/** The page's views, or `undefined` when its description has no `viewType`. */
const usePageViews = (): PageViews | undefined => {
  const views = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const { viewType, viewSettings, isLoadingViews, selectedView: view } = views
  const viewId = view?.id
  const viewLabel = view?.label
  const selectedView = useMemo(
    () => (viewId ? { id: viewId, label: viewLabel ?? '' } : undefined),
    [viewId, viewLabel],
  )

  const updateSettings = useCallback(
    (settings: Record<string, unknown>) =>
      updateViewSettings(settings, noLocalState, undefined, {}),
    [updateViewSettings],
  )

  return useMemo(
    () =>
      viewType
        ? {
            viewType,
            settings: viewSettings as Record<string, unknown> | undefined,
            isLoading: isLoadingViews,
            selectedView,
            updateSettings,
          }
        : undefined,
    [viewType, viewSettings, isLoadingViews, selectedView, updateSettings],
  )
}

const useProjectFolders = (): ProjectFolders => {
  const {
    folders,
    isLoading,
    getFolderById,
    getParentFolderIds,
    getChildFolderIds,
    getFolderIdsWithoutChildren,
  } = useProjectFoldersContext()

  return useMemo(
    () => ({
      // attrib is typed `object` in the api model
      folders: folders as FolderInfo[],
      isLoading,
      getFolderById: getFolderById as (id: string) => FolderInfo | undefined,
      getParentFolderIds,
      getChildFolderIds,
      getFolderIdsWithoutChildren,
    }),
    [
      folders,
      isLoading,
      getFolderById,
      getParentFolderIds,
      getChildFolderIds,
      getFolderIdsWithoutChildren,
    ],
  )
}

const selectedIds = (selection: RowSelectionState) =>
  Object.keys(selection).filter((id) => selection[id])

/**
 * The page's slicer: its selection, the pinned hierarchy slice (as ReportsPage passes it to the
 * legacy Reports module) and `select`, which the slicer applies once the page's view has loaded
 * (`selectWhenReady`): the slice types are stored in it, so a change made before it loads would be
 * overwritten.
 */
const usePageSlicer = (): PageSlicer => {
  const { rowSelection, sliceType, pinnedSlice, setPinnedSlice, selectWhenReady } =
    useSlicerContext()

  const clearPinned = useCallback(() => setPinnedSlice(null), [setPinnedSlice])

  const pinned = useMemo(
    () =>
      pinnedSlice
        ? { sliceType: pinnedSlice.sliceType, selection: selectedIds(pinnedSlice.rowSelection) }
        : null,
    [pinnedSlice],
  )

  return useMemo(
    () => ({
      sliceType,
      selection: selectedIds(rowSelection),
      pinned,
      clearPinned,
      select: selectWhenReady,
    }),
    [sliceType, rowSelection, pinned, clearPinned, selectWhenReady],
  )
}

/** The context of a project.page contribution. */
export const useProjectPageSlotContext = (
  projectName: string,
): SlotMap['project.page']['context'] => {
  // already in the cache: ProjectContextProvider runs the same query
  const { data: project } = useGetProjectQuery({ projectName })
  const projectFolders = useProjectFolders()
  // ProjectPage keeps a slicer per page (SlicerProvider page={module}); the page places it
  const slicer = usePageSlicer()
  const views = usePageViews()

  return useMemo(
    () => ({ projectName, project, slicer, projectFolders, views }),
    [projectName, project, slicer, projectFolders, views],
  )
}

/** The context of a studio.page contribution. */
export const useStudioPageSlotContext = (
  selectedProjects: string[],
): SlotMap['studio.page']['context'] => {
  const views = usePageViews()
  return useMemo(() => ({ selectedProjects, views }), [selectedProjects, views])
}
