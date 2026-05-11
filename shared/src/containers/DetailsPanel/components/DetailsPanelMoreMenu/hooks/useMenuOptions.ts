import { useMemo } from 'react'
import type { MenuItemType } from '@shared/components'
import { copyToClipboard } from '@shared/util'
import type { DetailsPanelEntityListsContext, SelectedEntityRef } from '../types'

interface UseMenuOptionsParams {
  entityType: string
  entityId?: string
  projectName?: string
  selectedEntities: SelectedEntityRef[]
  canUploadThumbnail: boolean
  canUploadVersion: boolean
  canOpenPip: boolean
  canOpenViewer: boolean
  entityListsContext: DetailsPanelEntityListsContext | undefined
  onPip: () => void
  onOpenViewer: () => void
  onUploadThumbnail: () => void
  onUploadVersion: () => void
  onViewData: () => void
}

// folder/task open in Overview; product/version/representation open in Products.
const buildEntityShareLink = (
  entityType: string,
  entityId: string,
  projectName: string,
): string | null => {
  const path =
    entityType === 'folder' || entityType === 'task'
      ? 'overview'
      : entityType === 'product' || entityType === 'version' || entityType === 'representation'
        ? 'products'
        : null
  if (!path) return null
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/projects/${projectName}/${path}?project=${projectName}&type=${entityType}&id=${entityId}`
}

const stripLeafIcons = (items: MenuItemType[]): MenuItemType[] =>
  items.map((item) => {
    const childItems = Array.isArray(item.items) ? stripLeafIcons(item.items) : undefined
    const next: MenuItemType = { ...item, ...(childItems ? { items: childItems } : {}) }
    if ((!childItems || childItems.length === 0) && next.id !== '__new-list__') {
      const { icon: _, ...rest } = next
      return rest as MenuItemType
    }
    return next
  })

/**
 * The EntityLists context emits PrimeReact-style menu items with a `command` field
 * for click handlers. The shared Menu component calls `onClick`. Translate the field
 * recursively so nested items (folder hierarchies, "+ New list", etc.) actually fire
 * their handlers when clicked.
 */
const adoptCommandsAsOnClick = (items: MenuItemType[]): MenuItemType[] =>
  items.map((item) => {
    const { command, items: children, onClick: existingOnClick, ...rest } = item as any
    const next: any = { ...rest }
    if (Array.isArray(children) && children.length) {
      next.items = adoptCommandsAsOnClick(children)
    }
    if (typeof command === 'function' || typeof existingOnClick === 'function') {
      next.onClick = (e: React.MouseEvent) => {
        if (item.disabled) return
        if (typeof command === 'function') command()
        if (typeof existingOnClick === 'function') existingOnClick(e)
      }
    }
    return next as MenuItemType
  })

export const useMenuOptions = ({
  entityType,
  entityId,
  projectName,
  selectedEntities,
  canUploadThumbnail,
  canUploadVersion,
  canOpenPip,
  canOpenViewer,
  entityListsContext,
  onPip,
  onOpenViewer,
  onUploadThumbnail,
  onUploadVersion,
  onViewData,
}: UseMenuOptionsParams): MenuItemType[] => {
  const normalizedSelected = useMemo<SelectedEntityRef[]>(() => {
    if (selectedEntities.length) {
      return selectedEntities
        .filter((e) => !!e?.entityId)
        .map((e) => ({ entityId: e.entityId, entityType: e.entityType || entityType }))
    }
    if (entityId) return [{ entityId, entityType }]
    return []
  }, [selectedEntities, entityId, entityType])

  return useMemo<MenuItemType[]>(() => {
    const items: MenuItemType[] = []

    if (canOpenViewer) {
      items.push({
        id: 'open-in-viewer',
        label: 'Open in viewer',
        icon: 'play_circle',
        onClick: onOpenViewer,
      })
    }

    if (canOpenPip) {
      items.push({
        id: 'picture-in-picture',
        label: 'Picture in picture',
        icon: 'picture_in_picture',
        onClick: onPip,
      })
    }

    if (canUploadThumbnail) {
      items.push({
        id: 'upload-thumbnail',
        label: 'Upload thumbnail',
        icon: 'add_photo_alternate',
        onClick: onUploadThumbnail,
      })
    }

    if (canUploadVersion) {
      items.push({
        id: 'upload-version',
        label: 'Upload version',
        icon: 'upload',
        onClick: onUploadVersion,
      })
    }

    if (entityListsContext && projectName && normalizedSelected.length) {
      const targetEntityType = normalizedSelected[0]?.entityType || entityType
      const sourceLists =
        targetEntityType === 'folder'
          ? entityListsContext.folders
          : targetEntityType === 'task'
            ? entityListsContext.tasks
            : targetEntityType === 'product'
              ? entityListsContext.products
              : targetEntityType === 'version' || targetEntityType === 'representation'
                ? [...(entityListsContext.versions || []), ...(entityListsContext.reviews || [])]
                : []

      const treeItems: MenuItemType[] =
        entityListsContext.buildHierarchicalMenuItems?.(
          sourceLists,
          normalizedSelected,
          () => true,
        ) ?? []

      const allowNewList =
        targetEntityType === 'folder' ||
        targetEntityType === 'task' ||
        targetEntityType === 'version'

      const newListItem = allowNewList
        ? entityListsContext.newListMenuItem?.(
            targetEntityType as 'folder' | 'task' | 'version',
            normalizedSelected,
          )
        : undefined

      const combined = [...treeItems, ...(newListItem ? [newListItem] : [])]
      const sanitized = stripLeafIcons(combined)
      const addToList = entityListsContext.buildAddToListMenu?.(sanitized)

      // Resolve the inner items, then translate `command` -> `onClick` recursively
      // so leaf clicks (add-to-existing-list, create-new-list) actually fire.
      const innerItems = addToList?.items?.length ? addToList.items : sanitized
      const wiredItems = adoptCommandsAsOnClick(innerItems)

      if (addToList && wiredItems.length) {
        items.push({
          id: addToList.id || 'add-to-list',
          label: addToList.label || 'Add to list',
          icon: addToList.icon || 'playlist_add',
          items: wiredItems,
        })
      }
    }

    const shareTarget = normalizedSelected[0]
    if (shareTarget?.entityId && projectName) {
      const shareLink = buildEntityShareLink(
        shareTarget.entityType || entityType,
        shareTarget.entityId,
        projectName,
      )
      if (shareLink) {
        items.push({
          id: 'copy-link',
          label: 'Copy link',
          icon: 'link',
          onClick: () => copyToClipboard(shareLink, true),
        })
      }
    }

    items.push({
      id: 'view-data',
      label: 'View data',
      icon: 'database',
      onClick: onViewData,
    })

    return items
  }, [
    canOpenPip,
    canOpenViewer,
    canUploadThumbnail,
    canUploadVersion,
    entityListsContext,
    projectName,
    normalizedSelected,
    entityType,
    onPip,
    onOpenViewer,
    onUploadThumbnail,
    onUploadVersion,
    onViewData,
  ])
}
