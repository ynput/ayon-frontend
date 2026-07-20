import { useMemo } from 'react'
import type { MenuItemType } from '@shared/components'
import type { DeletableEntity } from '@shared/context'
import { pluralize } from '@shared/util'
import type { DetailsPanelEntityListsContext, SelectedEntityRef, ListEntityRef } from '../types'

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
  const normalizedSelected = useMemo<ListEntityRef[]>(() => {
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

    if (entityListsContext?.openAddToListDialog && projectName && normalizedSelected.length) {
      const targetEntityType = normalizedSelected[0]?.entityType || entityType
      const openDialog = entityListsContext.openAddToListDialog

      items.push({
        id: 'add-to-list',
        label: 'Add to list',
        icon: 'list_alt_add',
        onClick: () => openDialog(targetEntityType, normalizedSelected),
      })

      // versions/representations can also go to review-session lists; gated on reviewables (YN-0683)
      const isVersionLike = targetEntityType === 'version' || targetEntityType === 'representation'
      if (isVersionLike && entityListsContext.hasReviewAddon) {
        const anyHasReviewables = normalizedSelected.some((e) => e.hasReviewables === true)
        items.push({
          id: 'add-to-review-list',
          label: 'Add to review list',
          icon: 'list_alt_add',
          disabled: !anyHasReviewables,
          ...(anyHasReviewables
            ? {}
            : { ['data-tooltip' as any]: 'No reviewables on selected version' }),
          onClick: () => openDialog(targetEntityType, normalizedSelected, { isReview: true }),
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
