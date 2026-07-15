import { useContext, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import { Menu, MenuContainer, DetailsDialog } from '@shared/components'
import {
  useMenuContext,
  ThumbnailUploadContext,
  useDeleteEntitiesContextOptional,
  isDeletableEntityType,
  type DeletableEntity,
} from '@shared/context'

import { useContextAccess } from './hooks/useContextAccess'
import { useMenuOptions } from './hooks/useMenuOptions'
import { ShareDialog } from './components/ShareDialog'
import type { DetailsPanelEntityListsContext, SelectedEntityRef } from './types'

export interface DetailsPanelMoreMenuProps {
  entityType: string
  entityId?: string
  entityIds?: string[]
  entityLabel?: string
  projectName?: string
  selectedEntities?: SelectedEntityRef[]
  entityListsContext?: DetailsPanelEntityListsContext
  onOpenPip?: () => void
  onOpenViewer?: (args: any) => void
  productId?: string
  taskId?: string
  folderId?: string
}

const buildViewerArgs = (
  entityType: string,
  entityId: string,
  projectName: string,
  parentProductId?: string,
): Record<string, unknown> | null => {
  const base = { projectName, quickView: true }
  switch (entityType) {
    case 'folder':
      return { ...base, folderId: entityId }
    case 'task':
      return { ...base, taskId: entityId }
    case 'product':
      return { ...base, productId: entityId }
    case 'version':
      // ViewerDialog opens on productId; version is selected within that product.
      return parentProductId
        ? { ...base, productId: parentProductId, versionIds: [entityId] }
        : null
    default:
      return null
  }
}

export const DetailsPanelMoreMenu = ({
  entityType,
  entityId,
  entityIds,
  entityLabel,
  projectName,
  selectedEntities = [],
  entityListsContext,
  onOpenPip,
  onOpenViewer,
  productId,
  taskId,
  folderId,
}: DetailsPanelMoreMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [showDataDialog, setShowDataDialog] = useState(false)
  const [shareDialogLink, setShareDialogLink] = useState<string | null>(null)
  const { menuOpen, toggleMenuOpen, setMenuOpen } = useMenuContext()

  const { triggerThumbnailUpload, canUploadVersion } = useContext(ThumbnailUploadContext)
  const { onOpenVersionUpload } = useContextAccess()

  // useId keeps the id unique per panel instance so the main panel and the slideout
  // never share it — a global menuOpen would otherwise open both menus at once.
  const instanceId = useId()
  const menuId = useMemo(() => {
    const seed = entityId || entityIds?.[0] || 'noentity'
    return `details-more-menu-${instanceId}-${seed}-${projectName || 'noproject'}`
  }, [instanceId, entityId, entityIds, projectName])

  const isOpen = menuOpen === menuId

  const canUploadThumbnail = !!entityId && !!projectName && !!triggerThumbnailUpload
  // Show "Upload version" only when both gates pass:
  //  - ThumbnailUploadContext flags this entity as version-uploadable (single, non-representation).
  //  - VersionUploadContext is mounted upstream so the proper form flow is available.
  // (No raw file-picker fallback — matches PR #1406's "only on project pages" semantics.)
  const canUploadVersionItem = !!canUploadVersion && !!onOpenVersionUpload

  const handleUploadVersion = () => {
    onOpenVersionUpload?.({ productId, taskId, folderId })
  }

  const viewerArgs =
    entityId && projectName
      ? buildViewerArgs(entityType, entityId, projectName, productId)
      : null
  const canOpenViewer = !!onOpenViewer && !!viewerArgs

  const deleteContext = useDeleteEntitiesContextOptional()

  const deletableEntities = useMemo<DeletableEntity[]>(() => {
    const source: SelectedEntityRef[] = selectedEntities.length
      ? selectedEntities
      : entityId
        ? [{ entityId, entityType, projectName }]
        : []
    return source
      .map((e): DeletableEntity | null => {
        const type = e.entityType || entityType
        const entityProjectName = e.projectName || projectName
        if (!isDeletableEntityType(type) || !e.entityId || !entityProjectName) return null
        return {
          id: e.entityId,
          entityType: type,
          name: e.name,
          label: e.label,
          projectName: entityProjectName,
          folderId: e.folderId,
          parentId: e.parentId,
        }
      })
      .filter((e): e is DeletableEntity => e !== null)
  }, [selectedEntities, entityId, entityType, projectName])

  const canDelete = !!deleteContext && deletableEntities.length > 0

  const handleDelete = () => {
    setMenuOpen(false)
    deleteContext?.deleteEntities(deletableEntities)
  }

  const { items } = useMenuOptions({
    entityType,
    entityId,
    projectName,
    selectedEntities,
    canUploadThumbnail,
    canUploadVersion: canUploadVersionItem,
    canOpenPip: !!onOpenPip,
    canOpenViewer,
    canDelete,
    entityListsContext,
    onPip: () => onOpenPip?.(),
    onOpenViewer: () => viewerArgs && onOpenViewer?.(viewerArgs),
    onUploadThumbnail: () => triggerThumbnailUpload?.(),
    onUploadVersion: handleUploadVersion,
    onShare: (link) => setShareDialogLink(link),
    onViewData: () => setShowDataDialog(true),
    onDelete: handleDelete,
  })

  const dialogIds = entityIds?.length ? entityIds : entityId ? [entityId] : []
  const shareLabel = entityLabel || entityId || ''

  return (
    <>
      <Button
        ref={buttonRef}
        icon="more_horiz"
        variant="text"
        data-tooltip="More actions"
        aria-label="More actions"
        className={clsx({ active: isOpen })}
        onClick={() => toggleMenuOpen(menuId)}
      />
      <MenuContainer id={menuId} target={buttonRef.current} align="right">
        <Menu menu={items} onClose={() => setMenuOpen(false)} />
      </MenuContainer>
      {showDataDialog && projectName && dialogIds.length > 0 && (
        <DetailsDialog
          projectName={projectName}
          entityType={entityType}
          entityIds={dialogIds}
          visible={showDataDialog}
          onHide={() => setShowDataDialog(false)}
        />
      )}
      {shareDialogLink && (
        <ShareDialog
          link={shareDialogLink}
          entityLabel={shareLabel}
          visible
          onHide={() => setShareDialogLink(null)}
        />
      )}
    </>
  )
}

export default DetailsPanelMoreMenu
