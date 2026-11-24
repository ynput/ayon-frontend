// The details panel's "more" (…) menu and the buttons addons pin next to it, as the panel's
// tools (TabbedPanel), with the dialogs its items open.
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import { contributionTags, menuItemsAt } from '@ynput/ayon-addon/host'
import type { PanelTool, PanelToolButtonProps } from '@shared/components/TabbedPanel'
import { DetailsDialog } from '@shared/components/DetailsDialog/DetailsDialog'
import {
  useDeleteEntitiesContextOptional,
  isDeletableEntityType,
  type DeletableEntity,
} from '@shared/context'

import { useContextAccess } from './hooks/useContextAccess'
import { useMenuOptions } from './hooks/useMenuOptions'
import { ShareDialog } from './components/ShareDialog'
import type { DetailsPanelEntityListsContext, SelectedEntityRef } from './types'

const SLOT = 'detailsPanel.menuItem'

export interface DetailsPanelMoreMenuOptions {
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
  /** opens the thumbnail file picker (the panel's ThumbnailUploadProvider is below this hook) */
  onUploadThumbnail?: () => void
  /** a single entity that takes versions (not a representation) */
  canUploadVersion?: boolean
}

// addon items are a section of their own
const section = (items: PanelTool[]): PanelTool[] =>
  items.length ? [{ divider: true }, ...items, { divider: true }] : []

const moreButtonProps: PanelToolButtonProps = {
  'data-tooltip': 'More actions',
  'aria-label': 'More actions',
  'data-ayon-trigger': SLOT,
}

export interface DetailsPanelMoreMenu {
  /** the pinned addon buttons and the menu's items */
  tools: PanelTool[]
  moreButtonProps: PanelToolButtonProps
  /** the dialogs its items open (View data, Share) */
  dialogs: ReactNode
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

export const useDetailsPanelMoreMenu = ({
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
  onUploadThumbnail,
  canUploadVersion,
}: DetailsPanelMoreMenuOptions): DetailsPanelMoreMenu => {
  const [showDataDialog, setShowDataDialog] = useState(false)
  const [shareDialogLink, setShareDialogLink] = useState<string | null>(null)

  const { onOpenVersionUpload } = useContextAccess()

  const canUploadThumbnail = !!entityId && !!projectName && !!onUploadThumbnail
  // Show "Upload version" only when both gates pass:
  //  - the panel flags this entity as version-uploadable (single, non-representation).
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
    return { projectName: projectName || '', entityType, entities }
  }, [selectedEntities, entityId, entityType, projectName])
  // the items draw from their descriptions; their code loads on hover, or when the menu opens
  const toTool = useCallback(
    (item: (typeof applicableAddonItems)[number]): PanelTool => ({
      id: item.key,
      label: item.label,
      icon: item.icon,
      pinned: item.pinned,
      onClick: () => runContribution(item, addonContext),
      onPrefetch: () => prefetchPiece(item.run),
      buttonProps: { 'data-addon-item': item.key, ...contributionTags(item) },
    }),
    [addonContext],
  )
  // pinned items are buttons before the menu, the rest are in it: `top` ones first, the others
  // (default) above View data and Delete
  const pinnedAddonItems = useMemo(
    () =>
      [...menuItemsAt(applicableAddonItems, 'top'), ...menuItemsAt(applicableAddonItems, 'bottom')]
        .filter((item) => item.pinned)
        .map(toTool),
    [applicableAddonItems, toTool],
  )
  const menuAddonItems = useMemo(
    () => applicableAddonItems.filter((item) => !item.pinned),
    [applicableAddonItems],
  )
  const addonTopItems = useMemo(
    () => section(menuItemsAt(menuAddonItems, 'top').map(toTool)),
    [menuAddonItems, toTool],
  )
  const addonItems = useMemo(
    () => section(menuItemsAt(menuAddonItems, 'bottom').map(toTool)),
    [menuAddonItems, toTool],
  )

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
    onUploadThumbnail: () => onUploadThumbnail?.(),
    onUploadVersion: handleUploadVersion,
    onShare: (link) => setShareDialogLink(link),
    onViewData: () => setShowDataDialog(true),
    onDelete: handleDelete,
  })

  const dialogIds = entityIds?.length ? entityIds : entityId ? [entityId] : []
  const shareLabel = entityLabel || entityId || ''

  const tools = useMemo(() => [...pinnedAddonItems, ...items], [pinnedAddonItems, items])

  const dialogs = (
    <>
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

  return { tools, moreButtonProps, dialogs }
}
