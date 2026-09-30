import { useMemo } from 'react'
import { useGetFolderListQuery, useGetProductVersionsQuery } from '@shared/api'
import type { FolderListItem } from '@shared/api'
import type { LinkMember } from './groupEntityLinks'

// links are loaded in one request, keep it within the query's page size
export const MAX_CHILDREN = 2000

export type EntityChildren = {
  /** the dialog knows how to list children of this entity type */
  supported: boolean
  childType?: 'folder' | 'version'
  children: LinkMember[]
  /** there were more than MAX_CHILDREN */
  truncated: boolean
  isLoading: boolean
}

const noChildren: EntityChildren = {
  supported: false,
  children: [],
  truncated: false,
  isLoading: false,
}

/**
 * Everything below an entity that links are usually attached to: all
 * descendant folders of a folder, all versions of a product.
 */
export const useEntityChildren = (
  projectName: string,
  entityType: string,
  entityId: string,
): EntityChildren => {
  const isFolder = entityType === 'folder'
  const isProduct = entityType === 'product'

  // same arguments as ProjectFoldersContext, so project pages have it cached
  const { data: folderData, isLoading: isLoadingFolders } = useGetFolderListQuery(
    { projectName, attrib: true },
    { skip: !isFolder },
  )
  const { data: versionsData, isLoading: isLoadingVersions } = useGetProductVersionsQuery(
    { projectName, productId: entityId },
    { skip: !isProduct },
  )

  return useMemo(() => {
    const limit = (children: LinkMember[]) => ({
      children: children.slice(0, MAX_CHILDREN),
      truncated: children.length > MAX_CHILDREN,
    })

    if (isFolder) {
      const byParent = new Map<string, FolderListItem[]>()
      for (const folder of folderData?.folders || []) {
        if (!folder.parentId) continue
        const siblings = byParent.get(folder.parentId)
        if (siblings) siblings.push(folder)
        else byParent.set(folder.parentId, [folder])
      }
      const children: LinkMember[] = []
      const queue = [entityId]
      for (let i = 0; i < queue.length; i++) {
        for (const folder of byParent.get(queue[i]) || []) {
          children.push({
            id: folder.id,
            entityType: 'folder',
            name: folder.name,
            subType: folder.folderType,
          })
          queue.push(folder.id)
        }
      }
      return {
        supported: true,
        childType: 'folder' as const,
        ...limit(children),
        isLoading: isLoadingFolders,
      }
    }

    if (isProduct) {
      const versions = versionsData?.project?.product?.versionList || []
      return {
        supported: true,
        childType: 'version' as const,
        ...limit(versions.map((v) => ({ id: v.id, entityType: 'version', name: v.name }))),
        isLoading: isLoadingVersions,
      }
    }

    return noChildren
  }, [isFolder, isProduct, folderData, versionsData, entityId, isLoadingFolders, isLoadingVersions])
}
