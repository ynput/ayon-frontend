import React, { useState, useRef } from 'react'
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
  onOpenPip: () => void
  refetch: () => Promise<any>
  entityListsContext?: any
}

export const DetailsPanelMoreMenu: React.FC<DetailsPanelMoreMenuProps> = ({
  entityType,
  firstEntityData,
  firstProject,
  onOpenPip,
  refetch,
  entityListsContext,
}) => {
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { toggleMenuOpen, setMenuOpen, menuOpen } = useMenuContext()

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
    toggleMenuOpen('details-more-menu')
  }

  const handleSetMenu = (menu: string | false) => {
    setMenuOpen(menu)
  }

  const menuItems = moreMenuOptions.map((option: any) => {
    const menuItem: any = {
      id: option.value,
      label: option.label,
      icon: option.icon,
    }

    if (option.items) {
      menuItem.items = option.items.map((subItem: any) => ({
        id: subItem.id,
        label: subItem.label,
        icon: subItem.icon,
        onClick: () => {
          subItem.command?.()
          setMenuOpen(false)
        },
      }))
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
        className={menuOpen === 'details-more-menu' ? 'active' : undefined}
      />

      <MenuContainer id="details-more-menu" target={buttonRef.current} align="right">
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
