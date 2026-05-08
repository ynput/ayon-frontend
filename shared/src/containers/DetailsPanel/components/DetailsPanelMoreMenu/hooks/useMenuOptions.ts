import { useMemo } from 'react'
import type { MenuItemType } from '@shared/components'
import type { DetailsPanelEntityListsContext, SelectedEntityRef } from '../types'

interface UseMenuOptionsParams {
  entityType: string
  entityId?: string
  projectName?: string
  selectedEntities: SelectedEntityRef[]
  canUploadThumbnail: boolean
  canUploadVersion: boolean
  canOpenPip: boolean
  entityListsContext: DetailsPanelEntityListsContext | undefined
  onPip: () => void
  onUploadThumbnail: () => void
  onUploadVersion: () => void
  onViewData: () => void
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
  entityListsContext,
  onPip,
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
        ? entityListsContext.newListMenuItem?.(targetEntityType, normalizedSelected)
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

    items.push({
      id: 'view-data',
      label: 'View data',
      icon: 'database',
      onClick: onViewData,
    })

    return items
  }, [
    canOpenPip,
    canUploadThumbnail,
    canUploadVersion,
    entityListsContext,
    projectName,
    normalizedSelected,
    entityType,
    onPip,
    onUploadThumbnail,
    onUploadVersion,
    onViewData,
  ])
}
