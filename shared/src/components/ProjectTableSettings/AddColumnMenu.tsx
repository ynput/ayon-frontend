import { FC, useEffect } from 'react'
import { Menu, MenuContainer, MenuItemType } from '../Menu'
import { useMenuContext } from '@shared/context'

interface AddColumnMenuProps {
  menuId: string
  menuItems: MenuItemType[]
  align?: 'left' | 'right'
}

export const AddColumnMenu: FC<AddColumnMenuProps> = ({ menuId, menuItems, align }) => {
  const { menuOpen, setMenuOpen } = useMenuContext()

  // adding the last column would otherwise leave an empty popup on screen
  useEffect(() => {
    if (!menuItems.length && menuOpen === menuId) setMenuOpen(false)
  }, [menuItems.length, menuOpen, menuId, setMenuOpen])

  return (
    <MenuContainer targetId={menuId} id={menuId} align={align}>
      <Menu menu={menuItems} onClose={() => setMenuOpen(false)} />
    </MenuContainer>
  )
}
