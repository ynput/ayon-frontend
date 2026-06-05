import React, { useState, ReactNode } from 'react'
import * as Styled from './Menu.styled'
import { MenuList } from './MenuList'
import { MENU_PORTAL_CONTENT_ID } from './MenuContainer'
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
  placement?: 'left' | 'right'
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

  const onMenuEnter = (
    e: React.MouseEvent,
    menu: Partial<SubMenu> & { items: MenuItemType[]; parentEl?: HTMLElement | null },
  ) => {
    // check to see if we need to open a submenu
    if (menu.items.length) {
      // yes, there is a submenu
      // open it if it is not already open
      if (!subMenus.find((m) => m.id === menu.id)) {
        // also close any other submenus on the same level
        // Prefer the explicit element passed from the source MenuItem ref; fall back to
        // currentTarget (the <li>) over target (which can be a nested span/icon).
        const parentEl =
          menu.parentEl ?? (e.currentTarget as HTMLElement) ?? (e.target as HTMLElement)
        setSubMenus([
          ...subMenus.filter((m) => m.level < (menu.level || 0) + 1),
          {
            ...menu,
            id: menu.id!,
            level: (menu.level || 0) + 1,
            parentRef: parentEl,
          } as SubMenu,
        ])
      }
    } else {
      // no items for this menu, so close all submenus on the higher levels
      setSubMenus(subMenus.filter((m) => m.level <= (menu.level || 0)))
    }
  }

  const onMenuLeave = (e: React.MouseEvent, menu: Partial<SubMenu> = {}) => {
    const related = e.relatedTarget as HTMLElement | null

    // Mouse exited the document entirely — keep menus open, user might come back.
    if (!related) return

    // Mouse moved onto the dialog backdrop itself — close everything.
    if (related.tagName === 'DIALOG') return setSubMenus([])

    // Mouse is still inside the menu portal (the DialogContent or any descendant).
    // The user is most likely traveling across a small gap toward an adjacent sub-menu.
    // Don't close anything — the next mouseenter will reconcile state.
    if (
      typeof related.closest === 'function' &&
      related.closest(`#${MENU_PORTAL_CONTENT_ID}`)
    )
      return

    // Mouse is targeting a known sub-menu element directly (id match) — keep open.
    const relatedTargetSubMenu = subMenus.find((m) => m.id === related.id)
    if (relatedTargetSubMenu) return

    setSubMenus(subMenus.filter((m) => m.level <= (menu.level || 0) + 1))
  }

  const handleSubMenu = (
    e: React.MouseEvent,
    menu: Partial<SubMenu> & { items: MenuItemType[] },
  ) => {
    if (e.type === 'mouseenter' || e.type === 'keydown') onMenuEnter(e, menu)
    else if (e.type === 'mouseleave') onMenuLeave(e, menu)
  }

  const handleSubMenuLayout = (
    id: string,
    style: React.CSSProperties,
    placement: 'left' | 'right',
  ) => {
    setSubMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, style, placement } : m)),
    )
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
          onSubMenuLayout={handleSubMenuLayout}
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
