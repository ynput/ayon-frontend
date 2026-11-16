import { useMemo } from 'react'
import type { EntityGroup, FolderListItem } from '@shared/api'
import { useProjectContext, useProjectFoldersContext } from '@shared/context'

// the folder list sends these flags but FolderListItem doesn't declare them
type FolderWithFlags = FolderListItem & { hasVersions?: boolean; hasProducts?: boolean }

const holdsEntity: Record<string, (folder: FolderWithFlags) => boolean> = {
  task: (folder) => !!folder.hasTasks,
  // hasVersions is true for the whole subtree, so parents show up as groups too
  version: (folder) => !!folder.hasVersions,
  product: (folder) => folder.hasProducts ?? !!folder.hasVersions,
}

// scopeFolderIds: hierarchy slicer selection, groups stay inside its subtrees
export const useFolderGroups = (
  entityType: string,
  enabled: boolean,
  scopeFolderIds?: string[],
) => {
  const { folders, isLoading, getChildFolderIds } = useProjectFoldersContext()
  const { getFolderType } = useProjectContext()

  const scope = useMemo(
    () =>
      enabled && scopeFolderIds?.length ? new Set(getChildFolderIds(scopeFolderIds, true)) : null,
    [enabled, scopeFolderIds, getChildFolderIds],
  )

  const groups = useMemo<EntityGroup[]>(() => {
    const predicate = holdsEntity[entityType]
    if (!enabled || !predicate) return []

    return (folders as FolderWithFlags[])
      .filter((folder) => predicate(folder) && (!scope || scope.has(folder.id)))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
      .map((folder) => ({
        value: folder.id,
        label: folder.path,
        icon: getFolderType(folder.folderType)?.icon,
      }))
  }, [enabled, entityType, folders, getFolderType, scope])

  return { groups, isLoading: enabled && isLoading }
}
