import { useContext, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import { Menu, MenuContainer, DetailsDialog } from '@shared/components'
import { useMenuContext, ThumbnailUploadContext } from '@shared/context'

import { useContextAccess } from './hooks/useContextAccess'
import { useMenuOptions } from './hooks/useMenuOptions'
import type { DetailsPanelEntityListsContext, SelectedEntityRef } from './types'

export interface DetailsPanelMoreMenuProps {
  entityType: string
  entityId?: string
  entityIds?: string[]
  projectName?: string
  selectedEntities?: SelectedEntityRef[]
  entityListsContext?: DetailsPanelEntityListsContext
  onOpenPip?: () => void
  productId?: string
  taskId?: string
  folderId?: string
}

export const DetailsPanelMoreMenu = ({
  entityType,
  entityId,
  entityIds,
  projectName,
  selectedEntities = [],
  entityListsContext,
  onOpenPip,
  productId,
  taskId,
  folderId,
}: DetailsPanelMoreMenuProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [showDataDialog, setShowDataDialog] = useState(false)
  const { menuOpen, toggleMenuOpen, setMenuOpen } = useMenuContext()

  const { triggerThumbnailUpload, canUploadVersion } = useContext(ThumbnailUploadContext)
  const { onOpenVersionUpload } = useContextAccess()

  const menuId = useMemo(() => {
    const seed = entityId || entityIds?.[0] || 'noentity'
    return `details-more-menu-${seed}-${projectName || 'noproject'}`
  }, [entityId, entityIds, projectName])

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

  const items = useMenuOptions({
    entityType,
    entityId,
    projectName,
    selectedEntities,
    canUploadThumbnail,
    canUploadVersion: canUploadVersionItem,
    canOpenPip: !!onOpenPip,
    entityListsContext,
    onPip: () => onOpenPip?.(),
    onUploadThumbnail: () => triggerThumbnailUpload?.(),
    onUploadVersion: handleUploadVersion,
    onViewData: () => setShowDataDialog(true),
  })

  const dialogIds = entityIds?.length ? entityIds : entityId ? [entityId] : []

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
    </>
  )
}

export default DetailsPanelMoreMenu
