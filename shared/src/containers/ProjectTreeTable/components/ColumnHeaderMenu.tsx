import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { Header } from '@tanstack/react-table'
import type { TableRow } from '../types/table'
import { useRef } from 'react'
import { useDispatch } from 'react-redux'
// @ts-expect-error - non TS file
import Menu from '../../../../../src/components/Menu/MenuComponents/Menu'
// @ts-expect-error - non TS file
import MenuContainer from '../../../../../src/components/Menu/MenuComponents/MenuContainer'
// @ts-expect-error - non TS file
import { toggleMenuOpen } from '../../../../../src/features/context'

const MenuButton = styled(Button)`
  background-color: unset !important;
  z-index: 110;
  position: relative;
  padding: 4px;

  &.hasIcon {
    padding: 4px;
  }

  &.open {
    background-color: unset !important;
  }

  &:hover,  &.active {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }
`

interface ColumnHeaderMenuProps {
  header: Header<TableRow, unknown>
  canHide?: boolean
  canPin?: boolean
  canSort?: boolean
  isResizing?: boolean
  className?: string
  menuId?: string
}

export const ColumnHeaderMenu = ({
  header,
  canHide,
  canPin,
  canSort,
  isResizing,
  className,
  menuId,
}: ColumnHeaderMenuProps) => {
  const { column } = header
  const dispatch = useDispatch()
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Hide the menu when resizing
  if (isResizing) {
    return null
  }

  const handleMenuToggle = (open: boolean = true) => {
    dispatch(toggleMenuOpen(open ? menuId : false))
  }

  // Get current column state - we need to call these methods directly to get fresh state
  const isPinned = column.getIsPinned()
  const isVisible = column.getIsVisible()

  const menuItems: Array<{
    id: string
    label?: string
    icon?: string
    onClick?: () => void
    type?: 'divider'
  }> = []

  if (canPin) {
    const isPinnedLeft = isPinned === 'left'
    menuItems.push({
      id: 'pin',
      label: isPinnedLeft ? 'Unpin column' : 'Pin column',
      icon: 'push_pin',
      onClick: () => {
        if (isPinnedLeft) {
          column.pin(false)
        } else {
          column.pin('left')
        }
        handleMenuToggle(false)
      },
    })
  }

  if (canPin && canSort) {
    menuItems.push({
      id: 'divider',
      type: 'divider',
    })
  }

  if (canSort) {
    menuItems.push({
      id: 'sort-asc',
      label: 'Sort ascending',
      icon: 'sort',
      onClick: () => {
        column.toggleSorting(false)
        handleMenuToggle(false)
      },
    })

    menuItems.push({
      id: 'sort-desc',
      label: 'Sort descending',
      icon: 'sort',
      onClick: () => {
        column.toggleSorting(true)
        handleMenuToggle(false)
      },
    })
  }

  if (canSort && canHide) {
    menuItems.push({
      id: 'divider',
      type: 'divider',
    })
  }

  if (canHide) {
    menuItems.push({
      id: 'hide',
      label: isVisible ? 'Hide column' : 'Show column',
      icon: isVisible ? 'visibility_off' : 'visibility',
      onClick: () => {
        column.toggleVisibility()
        handleMenuToggle(false)
      },
    })
  }

  if (menuItems.length === 0) {
    return null
  }

  return (
    <>
      <MenuButton
        ref={buttonRef}
        className={className}
        onClick={(e) => {
          e.stopPropagation()
          handleMenuToggle()
        }}
        icon="more_horiz"
        id={menuId}
      />
      <MenuContainer 
        target={buttonRef.current} 
        id={menuId} 
        align="left"
        onClose={(e: any) => {
          e.stopPropagation()
          handleMenuToggle(false)
        }}
      >
        <Menu menu={menuItems} onClose={() => handleMenuToggle(false)} />
      </MenuContainer>
    </>
  )
}
