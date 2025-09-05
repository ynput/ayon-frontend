import React, { useState, useRef } from 'react'
import { Button } from '@ynput/ayon-react-components'
import Menu from '@components/Menu/MenuComponents/Menu.jsx'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer.jsx'
import { useAppDispatch } from '@state/store'
import { toggleMenuOpen, setMenuOpen } from '@state/context'
import {
  useContextAccess,
  useThumbnailUpload,
  useMenuOptions,
  useMenuActions,
} from './hooks'
import { DetailsDialogWrapper } from './components'

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
  
  const dispatch = useAppDispatch()

  const { onOpenVersionUpload } = useContextAccess()

  const { triggerFileUpload } = useThumbnailUpload({
    entityType,
    firstEntityData,
    firstProject,
    refetch,
  })
  const moreMenuOptions = useMenuOptions({ onOpenVersionUpload, entityListsContext })
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
    dispatch(toggleMenuOpen('details-more-menu'))
  }

  const handleSetMenu = (menu: string | false) => {
    dispatch(setMenuOpen(menu))
  }

  const menuItems = moreMenuOptions.map((option: any) => ({
    id: option.value,
    label: option.label,
    icon: option.icon,
    onClick: () => {
      handleMoreMenuAction(option.value)
      dispatch(setMenuOpen(false))
    },
  }))

  return (
    <>
      <Button
        ref={buttonRef}
        icon="more_vert"
        variant="text"
        aria-label="More actions"
        data-tooltip="More actions"
        title="More actions"
        onClick={handleToggleMenu}
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
