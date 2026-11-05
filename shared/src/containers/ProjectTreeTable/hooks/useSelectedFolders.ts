import { useMemo } from 'react'
import { resolveSlicerFolders } from './resolveSlicerFolders'
import type { SelectedFoldersResult, SliceRowSelection } from './resolveSlicerFolders'

export type { SelectedFoldersResult, SliceRowSelection }
export { NO_MATCH_FOLDER_ID, scopeIdsToFolders } from './resolveSlicerFolders'

interface UseSelectedFoldersProps {
  slices: SliceRowSelection[]
  entityListFolderIds?: string[]
  getChildFolderIds?: (folderIds: string[], includeSelf?: boolean) => string[]
  // top-most folders the hierarchy panel search matches, null without a search
  searchFolderIds?: string[] | null
}

export const useSelectedFolders = ({
  slices,
  entityListFolderIds,
  getChildFolderIds,
  searchFolderIds,
}: UseSelectedFoldersProps): SelectedFoldersResult =>
  useMemo(
    () => resolveSlicerFolders(slices, entityListFolderIds, getChildFolderIds, searchFolderIds),
    [slices, entityListFolderIds, getChildFolderIds, searchFolderIds],
  )
