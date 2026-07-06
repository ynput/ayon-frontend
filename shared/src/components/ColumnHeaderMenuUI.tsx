import { useRef } from 'react'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useMenuContext } from '@shared/context'
import { Menu, MenuContainer } from './Menu'
import type { MenuItemType } from './Menu'

export type ColumnMenuItemType = {
  id: string
  label?: string
  icon?: string
  className?: string
  onClick?: () => void
  type?: 'divider'
  selected?: boolean
}

export const ColumnMenuButton = styled(Button)<{ $isOpen: boolean }>`
  background-color: unset !important;
  z-index: 110;
  position: relative;
  padding: 2px;
  width: 24px;
  height: 24px;

  &.hasIcon {
    padding: 2px;
  }

  &:hover,
  &.active {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }

  ${({ $isOpen }) =>
    $isOpen &&
    `
    background-color: var(--md-sys-color-surface-container-hover) !important;
  `}
`

interface ColumnHeaderMenuUIProps {
  menuItems: ColumnMenuItemType[]
  menuId: string
  className?: string
}

/**
 * Self-contained column header menu UI.
 * Uses the shared MenuContainer/Menu infrastructure and MenuContext for open state.
 */
export const ColumnHeaderMenuUI = ({ menuItems, menuId, className }: ColumnHeaderMenuUIProps) => {
  const { toggleMenuOpen, menuOpen } = useMenuContext()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const isOpen = menuOpen === menuId

  if (menuItems.length === 0) return null

  return (
    <>
      <ColumnMenuButton
        ref={buttonRef}
        className={className}
        onClick={(e) => {
          e.stopPropagation()
          toggleMenuOpen(menuId)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        icon="more_horiz"
        $isOpen={isOpen}
      />
      <MenuContainer
        target={buttonRef.current}
        id={menuId}
        align="left"
        onClose={(e: any) => {
          e.stopPropagation()
          toggleMenuOpen(false)
        }}
      >
        <Menu menu={menuItems as MenuItemType[]} onClose={() => toggleMenuOpen(false)} />
      </MenuContainer>
    </>
  )
}
