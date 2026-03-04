import React, { useState, ReactNode } from 'react'
import * as Styled from './Menu.styled'
import { MenuList } from './MenuList'
import { copyToClipboard } from '@shared/util'
import { Button } from '@ynput/ayon-react-components'
import { PowerpackFeature, useMenuContext, usePowerpack } from '@shared/context'

export interface MenuItemType {
  id: string
  label?: string | string[]
  icon?: string
  img?: string
  highlighted?: boolean
  notification?: boolean
  selected?: boolean
  danger?: boolean
  items?: MenuItemType[]
  onClick?: (e: React.MouseEvent) => void
  link?: string
  disableClose?: boolean
  disabled?: boolean
  powerFeature?: PowerpackFeature
  active?: boolean
  hidden?: boolean
  node?: ReactNode
  [key: string]: any
}

interface SubMenu {
  id: string
  items: MenuItemType[]
  level: number
  parentRef?: HTMLElement
  style?: React.CSSProperties
}

interface MenuProps {
  menu?: MenuItemType[]
  onClose?: () => void
  header?: ReactNode
  footer?: string
}

export const Menu: React.FC<MenuProps> = ({ menu = [], onClose, header, footer = '' }) => {
  const { setPowerpackDialog } = usePowerpack()
  const { setMenuOpen } = useMenuContext()

  const [subMenus, setSubMenus] = useState<SubMenu[]>([])
  //   When a menu item is clicked, the following happens:
  const handleClick = (
    e: React.MouseEvent,
    onClick?: (e: React.MouseEvent) => void,
    url?: string,
    disableClose?: boolean,
  ) => {
    // this is handled by Link component inside the MenuItem
    if (url) return onClose?.()

    onClick?.(e)

    if (!disableClose && onClose) onClose()
  }

  const onMenuEnter = (e: React.MouseEvent, menu: Partial<SubMenu> & { items: MenuItemType[] }) => {
    // check to see if we need to open a submenu
    if (menu.items.length) {
      // yes, there is a submenu
      // open it if it is not already open
      if (!subMenus.find((m) => m.id === menu.id)) {
        // also close any other submenus on the same level
        setSubMenus([
          ...subMenus.filter((m) => m.level < (menu.level || 0) + 1),
          {
            ...menu,
            id: menu.id!,
            level: (menu.level || 0) + 1,
            parentRef: e.target as HTMLElement,
          } as SubMenu,
        ])
      }
    } else {
      // no items for this menu, so close all submenus on the higher levels
      setSubMenus(subMenus.filter((m) => m.level <= (menu.level || 0)))
    }
  }

  const onMenuLeave = (e: React.MouseEvent, menu: Partial<SubMenu> = {}) => {
    // target where we are going
    const relatedTargetId = (e.relatedTarget as HTMLElement)?.id
    const relatedTargetSubMenu = subMenus.find((m) => m.id === relatedTargetId)

    if ((e.relatedTarget as HTMLElement)?.tagName === 'DIALOG') return setSubMenus([])

    if (!relatedTargetSubMenu) {
      setSubMenus(subMenus.filter((m) => m.level <= (menu.level || 0) + 1))
    }
    //   if (menu.items.length) {
  }

  const handleSubMenu = (
    e: React.MouseEvent,
    menu: Partial<SubMenu> & { items: MenuItemType[] },
  ) => {
    if (e.type === 'mouseenter' || e.type === 'keydown') onMenuEnter(e, menu)
    else if (e.type === 'mouseleave') onMenuLeave(e, menu)
  }

  return (
    <>
      <Styled.Section>
        {header && header}
        <MenuList
          items={menu}
          handleClick={handleClick}
          onSubMenu={handleSubMenu}
          level={0}
          setPowerpackDialog={setPowerpackDialog}
          onMenuClose={() => setMenuOpen(false)}
        />
        {footer && (
          <Styled.Footer>
            {footer}
            <Button icon="content_copy" variant="text" onClick={() => copyToClipboard(footer)} />
          </Styled.Footer>
        )}
      </Styled.Section>
      {subMenus.map((menu, i) => (
        <MenuList
          key={i}
          {...menu}
          parentRef={menu.parentRef || null}
          style={menu.style || {}}
          handleClick={handleClick}
          subMenu
          onSubMenu={handleSubMenu}
          onClose={() => setSubMenus(subMenus.filter((m) => m.id !== menu.id))}
          onMenuClose={() => setMenuOpen(false)}
          onChange={onMenuEnter}
          setPowerpackDialog={setPowerpackDialog}
          itemClassName={undefined}
          itemStyle={undefined}
        />
      ))}
    </>
  )
}
