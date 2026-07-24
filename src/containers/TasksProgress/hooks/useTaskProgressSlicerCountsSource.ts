import { useMemo } from 'react'
import { useSlicerContext, useTaskProgressViewSettings } from '@shared/containers'
import { useQueryFilters } from '@shared/containers/ProjectTreeTable'
import type { SlicerCountsSource } from '@shared/containers/Slicer'
import { resolveSelectedFolders } from '../helpers'
import { useRootFolders } from './useRootFolders'

// Filter-aware args for the slicer value-count badges on the progress page.
// Mirrors the progress table's own scope (folders + search filters) but omits
// the active slice filter, so a selected value keeps its siblings' true counts.
export const useTaskProgressSlicerCountsSource = (projectName: string): SlicerCountsSource => {
  const { filters: queryFilters } = useTaskProgressViewSettings()
  const { rowSelection, sliceType, pinnedSlice } = useSlicerContext()
  const rootFolderIds = useRootFolders()

  const { filterString, search } = useQueryFilters({
    queryFilters,
    config: { searchKey: 'name' },
  })

  const folderIds = useMemo(
    () =>
      resolveSelectedFolders(rowSelection, pinnedSlice?.rowSelection, rootFolderIds, sliceType),
    [rowSelection, pinnedSlice?.rowSelection, rootFolderIds, sliceType],
  )

  return useMemo<SlicerCountsSource>(
    () => ({
      entity: 'task',
      args: {
        projectName,
        filter: filterString || undefined,
        search: search || undefined,
        folderIds: folderIds.length ? folderIds : undefined,
      },
    }),
    [projectName, filterString, search, folderIds],
  )
}
