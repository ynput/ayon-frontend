import { useMemo } from 'react'
import type { MenuItemType } from '@shared/components'
import type { DeletableEntity } from '@shared/context'
import { pluralize } from '@shared/util'
import type { DetailsPanelEntityListsContext, SelectedEntityRef } from '../types'

interface UseMenuOptionsParams {
  entityType: string
  entityId?: string
  projectName?: string
  selectedEntities: SelectedEntityRef[]
  // resolved delete target — drives both the delete gate and its label so they
  // stay in sync with whatever is actually deleted (cell selection in the tree table)
  deleteEntities: DeletableEntity[]
  canUploadThumbnail: boolean
  canUploadVersion: boolean
  canOpenPip: boolean
  canOpenViewer: boolean
  canDelete: boolean
  entityListsContext: DetailsPanelEntityListsContext | undefined
  onPip: () => void
  onOpenViewer: () => void
  onUploadThumbnail: () => void
  onUploadVersion: () => void
  onShare: (link: string) => void
  onViewData: () => void
  onDelete: () => void
}

export interface MenuOptionsResult {
  items: MenuItemType[]
  shareLink: string | null
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

/**
 * Recursively walk the add-to-list tree and disable any leaf whose id matches a
 * review-session list. Folder containers stay enabled but their disabled review
 * leaves render greyed out with an explanatory tooltip (YN-0683 / issue #1947).
 */
const markReviewLeavesDisabled = (
  items: MenuItemType[],
  reviewListIds: Set<string>,
): MenuItemType[] =>
  items.map((item) => {
    const children = Array.isArray(item.items) ? item.items : undefined
    if (children?.length) {
      return { ...item, items: markReviewLeavesDisabled(children, reviewListIds) }
    }
    if (item.id && reviewListIds.has(item.id)) {
      return {
        ...item,
        disabled: true,
        ['data-tooltip' as any]: 'No reviewables on selected version',
      }
    }
    return item
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
  deleteEntities,
  canUploadThumbnail,
  canUploadVersion,
  canOpenPip,
  canOpenViewer,
  canDelete,
  entityListsContext,
  onPip,
  onOpenViewer,
  onUploadThumbnail,
  onUploadVersion,
  onShare,
  onViewData,
  onDelete,
}: UseMenuOptionsParams): MenuOptionsResult => {
  const normalizedSelected = useMemo<SelectedEntityRef[]>(() => {
    if (selectedEntities.length) {
      return selectedEntities
        .filter((e) => !!e?.entityId)
        .map((e) => ({
          entityId: e.entityId,
          entityType: e.entityType || entityType,
          hasReviewables: e.hasReviewables,
        }))
    }
    if (entityId) return [{ entityId, entityType }]
    return []
  }, [selectedEntities, entityId, entityType])

  return useMemo<MenuOptionsResult>(() => {
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

      // YN-0683 / issue #1947: review-session lists stay visible but are disabled
      // when no selected version has reviewables. Mirrors entity-picker behavior.
      const anyHasReviewables = normalizedSelected.some((e) => e.hasReviewables === true)
      const reviewListIds = new Set(
        (entityListsContext.reviews || []).map((l) => l.id).filter(Boolean) as string[],
      )
      const disableReviewLeaves = !anyHasReviewables && reviewListIds.size > 0

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
      const addToList = entityListsContext.buildAddToListMenu?.(combined)

      // Resolve the inner items, then translate `command` -> `onClick` recursively
      // so leaf clicks (add-to-existing-list, create-new-list) actually fire.
      const innerItems = addToList?.items?.length ? addToList.items : combined
      const gatedItems = disableReviewLeaves
        ? markReviewLeavesDisabled(innerItems, reviewListIds)
        : innerItems
      const wiredItems = adoptCommandsAsOnClick(gatedItems)

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
    const shareLink =
      shareTarget?.entityId && projectName
        ? buildEntityShareLink(
            shareTarget.entityType || entityType,
            shareTarget.entityId,
            projectName,
          )
        : null
    if (shareLink) {
      items.push({
        id: 'share',
        label: 'Share',
        icon: 'share',
        onClick: () => onShare(shareLink),
      })
    }

    items.push({
      id: 'view-data',
      label: 'View data',
      icon: 'database',
      onClick: onViewData,
    })

    // Delete stays at the very bottom, styled as a danger action.
    if (canDelete && deleteEntities.length > 0) {
      const types = new Set(deleteEntities.map((e) => e.entityType))
      const noun = types.size === 1 ? [...types][0] : 'item'
      const label =
        deleteEntities.length === 1
          ? `Delete ${noun}`
          : `Delete ${pluralize(deleteEntities.length, noun)}`
      items.push({
        id: 'delete',
        label,
        icon: 'delete',
        danger: true,
        onClick: onDelete,
      })
    }

    return { items, shareLink }
  }, [
    canOpenPip,
    canOpenViewer,
    canUploadThumbnail,
    canUploadVersion,
    canDelete,
    deleteEntities,
    entityListsContext,
    projectName,
    normalizedSelected,
    entityType,
    onPip,
    onOpenViewer,
    onUploadThumbnail,
    onUploadVersion,
    onShare,
    onViewData,
    onDelete,
  ])
}
