import React, { useState, useRef, useMemo } from 'react'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
// @ts-ignore
import Menu from '@/components/Menu/MenuComponents/Menu'
// @ts-ignore
import MenuContainer from '@/components/Menu/MenuComponents/MenuContainer'
import { useMenuContext } from '@shared/context/MenuContext'
import { useContextAccess, useThumbnailUpload, useMenuOptions, useMenuActions } from './hooks'
import { DetailsDialogWrapper } from './components'

const MenuButton = styled(Button)`
  &.active {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }
`

interface DetailsPanelMoreMenuProps {
  entityType: string
  firstEntityData: any
  firstProject: string
  selectedEntities?: { entityId: string; entityType?: string }[]
  onOpenPip: () => void
  refetch: () => Promise<any>
  entityListsContext?: any
}

export const DetailsPanelMoreMenu: React.FC<DetailsPanelMoreMenuProps> = ({
  entityType,
  firstEntityData,
  firstProject,
  selectedEntities,
  onOpenPip,
  refetch,
  entityListsContext,
}) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { toggleMenuOpen, setMenuOpen, menuOpen } = useMenuContext()

  const panelInstanceId = useMemo(() => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const entityPath = firstEntityData?.path || firstEntityData?.folderPath || 'unknown-path'
    return `${timestamp}-${random}-${entityPath.replace(/[^a-zA-Z0-9]/g, '-')}`
  }, [firstEntityData])

  const menuId = `details-more-menu-${panelInstanceId}`

  const { onOpenVersionUpload } = useContextAccess()

  const { triggerFileUpload } = useThumbnailUpload({
    entityType,
    firstEntityData,
    firstProject,
    refetch,
  })

  const moreMenuOptions = useMenuOptions({
    onOpenVersionUpload,
    entityListsContext,
    entityType,
    firstEntityData,
    selectedEntities,
  })
  const { handleMoreMenuAction } = useMenuActions({
    entityType,
    firstEntityData,
    firstProject,
    onOpenPip,
    onOpenVersionUpload,
    entityListsContext,
    triggerFileUpload,
    setShowDetailsDialog,
  })

  const handleToggleMenu = () => {
    toggleMenuOpen(menuId)
  }

  const handleSetMenu = (menu: string | false) => {
    setMenuOpen(menu)
  }

  const transformMenuItem = (item: any): any => {
    const { command, items, ...rest } = item
    const transformed: any = { ...rest }

    if (Array.isArray(items) && items.length) {
      transformed.items = items.map((child: any) => transformMenuItem(child))
    } else {
      transformed.onClick = (...args: any[]) => {
        if (item.disabled) return
        command?.()
        if (typeof item.onClick === 'function') {
          item.onClick(...args)
        }
        setMenuOpen(false)
      }
    }

    return transformed
  }

  const menuItems = moreMenuOptions.map((option: any) => {
    const menuItem: any = {
      id: option.value,
      label: option.label,
      icon: option.icon,
    }

    if (option.items) {
      menuItem.items = option.items.map((subItem: any) => transformMenuItem(subItem))
    } else {
      menuItem.onClick = () => {
        handleMoreMenuAction(option.value)
        setMenuOpen(false)
      }
    }

    return menuItem
  })

  return (
    <>
      <MenuButton
        ref={buttonRef}
        icon="more_horiz"
        variant="text"
        aria-label="More actions"
        data-tooltip="More actions"
        title="More actions"
        onClick={handleToggleMenu}
        className={menuOpen === menuId ? 'active' : undefined}
      />

      <MenuContainer id={menuId} target={buttonRef.current} align="right">
        <Menu menu={menuItems} onClose={() => handleSetMenu(false)} />
      </MenuContainer>

      <DetailsDialogWrapper
        showDetailsDialog={showDetailsDialog}
        firstEntityData={firstEntityData}
        firstProject={firstProject}
        entityType={entityType}
        onHide={() => setShowDetailsDialog(false)}
      />
    </>
  )
}
