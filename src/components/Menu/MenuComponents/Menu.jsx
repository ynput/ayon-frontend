import React, { useState } from 'react'
import * as Styled from './Menu.styled'
import MenuList from './MenuList'
import { copyToClipboard } from '@shared/util'
import { Button } from '@ynput/ayon-react-components'
import { useMenuContext, usePowerpack } from '@shared/context'

const Menu = ({ menu = [], onClose, header, footer = '' }) => {
  const { setPowerpackDialog } = usePowerpack()
  const { setMenuOpen } = useMenuContext()

  const [subMenus, setSubMenus] = useState([])
  //   When a menu item is clicked, the following happens:
  const handleClick = (e, onClick, url, disableClose) => {
    // this is handled by Link component inside the MenuItem
    if (url) return onClose()

    onClick && onClick(e)

    !disableClose && onClose && onClose()
  }

  const onMenuEnter = (e, menu = {}) => {
    // check to see if we need to open a submenu
    if (menu.items.length) {
      // yes, there is a submenu
      // open it if it is not already open
      if (!subMenus.find((m) => m.id === menu.id)) {
        // also close any other submenus on the same level
        setSubMenus([
          ...subMenus.filter((m) => m.level < menu.level + 1),
          { ...menu, id: menu.id, level: menu.level + 1, parentRef: e.target },
        ])
      }
    } else {
      // no items for this menu, so close all submenus on the higher levels
      setSubMenus(subMenus.filter((m) => m.level <= menu.level))
    }
  }

  const onMenuLeave = (e, menu = {}) => {
    // target where we are going
    const relatedTargetId = e.relatedTarget?.id
    const relatedTargetSubMenu = subMenus.find((m) => m.id === relatedTargetId)

    if (e.relatedTarget?.tagName === 'DIALOG') return setSubMenus([])

    if (!relatedTargetSubMenu) {
      setSubMenus(subMenus.filter((m) => m.level <= (menu.level || 0) + 1))
    }
    //   if (menu.items.length) {
  }

  const handleSubMenu = (e, menu = {}) => {
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
          items={menu.items}
          handleClick={handleClick}
          {...menu}
          subMenu
          onSubMenu={handleSubMenu}
          onClose={() => setSubMenus(subMenus.filter((m) => m.id !== menu.id))}
          onMenuClose={() => setMenuOpen(false)}
          onChange={onMenuEnter}
          setPowerpackDialog={setPowerpackDialog}
        />
      ))}
    </>
  )
}

export default Menu
