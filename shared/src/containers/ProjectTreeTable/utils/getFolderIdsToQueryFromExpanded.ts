import { ProjectFoldersContextValue } from '@shared/context'
import { ExpandedState } from '@tanstack/react-table'

export const getFolderIdsToQueryFromExpanded = (
  expanded: ExpandedState,
  expandedParentIds: string[],
  selectedFolders: string[],
  excludeSelectedFolders: boolean,
  getFolderById: ProjectFoldersContextValue['getFolderById'],
) => {
  const expandedMap = expanded as Record<string, boolean>
  const memoVisibility = new Map<string, boolean>()

  const isFolderVisible = (id: string): boolean => {
    // If visibility for this specific branch path was already calculated, return it instantly
    if (memoVisibility.has(id)) return memoVisibility.get(id)!

    const folder = getFolderById(id)
    if (!folder) {
      memoVisibility.set(id, false)
      return false
    }

    const parentId = folder.parentId as string

    // Top-level root folders (no parent) are always visible
    if (!parentId) {
      memoVisibility.set(id, true)
      return true
    }

    // Check if this folder acts as a boundary root from the slicer selection
    const isRootFromSlicer = excludeSelectedFolders
      ? selectedFolders.includes(parentId)
      : selectedFolders.includes(id)

    if (isRootFromSlicer) {
      memoVisibility.set(id, true)
      return true
    }

    // Chain step: Visible ONLY if the immediate parent is expanded AND that parent path is visible
    const visible = expandedMap[parentId] === true && isFolderVisible(parentId)

    // Cache the result to protect sibling lookups from re-walking this shared ancestral path
    memoVisibility.set(id, visible)
    return visible
  }

  // We ONLY loop over the expanded folder IDs, never the full project folder array!
  return expandedParentIds.filter((id) => isFolderVisible(id))
}
