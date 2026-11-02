import { RowSelectionState } from '@tanstack/react-table'
import { SliceType } from '@shared/containers'

// Folders the progress table is scoped to: selected rows in hierarchy, the
// pinned slice selection, or all root folders when slicing by a field.
export const resolveSelectedFolders = (
  rowSelection: RowSelectionState,
  pinnedRowSelection: RowSelectionState | null | undefined,
  rootFolderIds: string[],
  sliceType: SliceType,
): string[] => {
  if (sliceType === 'hierarchy') {
    return Object.keys(rowSelection)
  } else if (pinnedRowSelection) {
    return Object.keys(pinnedRowSelection).filter((id) => pinnedRowSelection[id])
  } else {
    return rootFolderIds
  }
}
