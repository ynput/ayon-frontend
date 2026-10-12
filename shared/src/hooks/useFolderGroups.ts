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

export const useFolderGroups = (entityType: string, enabled: boolean) => {
  const { folders, isLoading } = useProjectFoldersContext()
  const { getFolderType } = useProjectContext()

  const groups = useMemo<EntityGroup[]>(() => {
    const predicate = holdsEntity[entityType]
    if (!enabled || !predicate) return []

    return (folders as FolderWithFlags[])
      .filter(predicate)
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
      .map((folder) => ({
        value: folder.id,
        label: folder.path,
        icon: getFolderType(folder.folderType)?.icon,
      }))
  }, [enabled, entityType, folders, getFolderType])

  return { groups, isLoading: enabled && isLoading }
}
