import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import { menuItemsAt } from '@ynput/ayon-addon/host'
import type { MenuItemType } from '@shared/components/Menu/Menu'
import { Button } from '@ynput/ayon-react-components'
import { Menu } from '@shared/components/Menu/Menu'
import { MenuContainer } from '@shared/components/Menu/MenuContainer'
import { DetailsDialog } from '@shared/components/DetailsDialog/DetailsDialog'
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
    entityId && projectName ? buildViewerArgs(entityType, entityId, projectName, productId) : null
  const canOpenViewer = !!onOpenViewer && !!viewerArgs

  const deleteContext = useDeleteEntitiesContextOptional()

  // Delete acts only on what this panel currently displays — never an outside selection,
  // which can diverge from the panel's entity and delete the wrong thing.
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

  // items addons contribute to this menu (detailsPanel.menuItem slot, @ynput/ayon-addon)
  const { contributions: addonMenuItems } = useContributions('detailsPanel.menuItem')
  const applicableAddonItems = useMemo(
    () =>
      addonMenuItems.filter(
        (item) => !item.entityTypes?.length || item.entityTypes.includes(entityType),
      ),
    [addonMenuItems, entityType],
  )
  const addonContext = useMemo(() => {
    const source: SelectedEntityRef[] = selectedEntities.length
      ? selectedEntities
      : entityId
      ? [{ entityId, entityType, projectName }]
      : []
    const entities = source.map((e) => ({
      id: e.entityId,
      entityType: e.entityType || entityType,
      projectName: e.projectName || projectName || '',
      name: e.name,
      label: e.label || undefined,
    }))
    // selectedEntities: the deprecated name of entities
    return { projectName: projectName || '', entityType, entities, selectedEntities: entities }
  }, [selectedEntities, entityId, entityType, projectName])
  const toMenuItem = useCallback(
    (item: (typeof applicableAddonItems)[number]): MenuItemType => ({
      id: item.key,
      label: item.label,
      icon: item.icon,
      'data-addon-item': item.key,
      onClick: () => runContribution(item, addonContext),
    }),
    [addonContext],
  )
  // pinned items are buttons next to this one, the rest are in the menu: `top` ones first, the
  // others (default) above View data and Delete
  const pinnedAddonItems = useMemo(
    () => [
      ...menuItemsAt(applicableAddonItems, 'top'),
      ...menuItemsAt(applicableAddonItems, 'bottom'),
    ].filter((item) => item.pinned),
    [applicableAddonItems],
  )
  const menuAddonItems = useMemo(
    () => applicableAddonItems.filter((item) => !item.pinned),
    [applicableAddonItems],
  )
  const addonTopItems = useMemo(
    () => menuItemsAt(menuAddonItems, 'top').map(toMenuItem),
    [menuAddonItems, toMenuItem],
  )
  const addonItems = useMemo(
    () => menuItemsAt(menuAddonItems, 'bottom').map(toMenuItem),
    [menuAddonItems, toMenuItem],
  )
  // the items draw from their descriptions; their code loads when the menu opens
  useEffect(() => {
    if (isOpen) menuAddonItems.forEach((item) => prefetchPiece(item.run))
  }, [isOpen, menuAddonItems])

  const { items } = useMenuOptions({
    entityType,
    entityId,
    projectName,
    selectedEntities,
    deleteEntities: deletableEntities,
    canUploadThumbnail,
    canUploadVersion: canUploadVersionItem,
    canOpenPip: !!onOpenPip,
    canOpenViewer,
    canDelete,
    entityListsContext,
    extraTopItems: addonTopItems,
    extraItems: addonItems,
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
      {pinnedAddonItems.map((item) => (
        <Button
          key={item.key}
          // addons name any Material Symbols icon
          icon={item.icon as never}
          variant="text"
          data-tooltip={item.label}
          aria-label={item.label}
          data-addon-item={item.key}
          onMouseEnter={() => prefetchPiece(item.run)}
          onClick={() => runContribution(item, addonContext)}
        />
      ))}
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
