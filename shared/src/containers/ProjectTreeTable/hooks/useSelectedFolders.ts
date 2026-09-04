import { useMemo } from 'react'
import { resolveSlicerFolders } from './resolveSlicerFolders'
import type { SelectedFoldersResult, SliceRowSelection } from './resolveSlicerFolders'

export type { SelectedFoldersResult, SliceRowSelection }
export { NO_MATCH_FOLDER_ID, scopeIdsToFolders } from './resolveSlicerFolders'

interface UseSelectedFoldersProps {
  slices: SliceRowSelection[]
  entityListFolderIds?: string[]
  getChildFolderIds?: (folderIds: string[], includeSelf?: boolean) => string[]
}

export const useSelectedFolders = ({
  slices,
  entityListFolderIds,
  getChildFolderIds,
}: UseSelectedFoldersProps): SelectedFoldersResult =>
  useMemo(
    () => resolveSlicerFolders(slices, entityListFolderIds, getChildFolderIds),
    [slices, entityListFolderIds, getChildFolderIds],
  )
