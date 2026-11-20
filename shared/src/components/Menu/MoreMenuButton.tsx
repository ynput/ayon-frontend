// A button that opens the shared Menu with its items, closed again by a click on one: a panel's
// "more" (…) menu (TabbedPanel's tools) and the addon SDK's MoreMenu.
import { useId, useState } from 'react'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import type { ButtonProps } from '@ynput/ayon-react-components'
import { useMenuContext } from '@shared/context'
import { Menu } from './Menu'
import type { MenuItemType } from './Menu'
import { MenuContainer } from './MenuContainer'

export interface MoreMenuButtonProps extends Omit<ButtonProps, 'onClick' | 'ref'> {
  items: MenuItemType[]
  align?: 'left' | 'right'
  /** the menu opens: load what its items need */
  onOpen?: () => void
}

export const MoreMenuButton = ({
  items,
  align = 'right',
  onOpen,
  icon = 'more_horiz',
  variant = 'text',
  className,
  ...props
}: MoreMenuButtonProps) => {
  const { menuOpen, toggleMenuOpen, setMenuOpen } = useMenuContext()
  // one menu is open at a time app-wide: the id keeps two of these apart
  const menuId = `more-menu:${useId()}`
  const isOpen = menuOpen === menuId
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)

  return (
    <>
      <Button
        ref={setAnchor}
        icon={icon}
        variant={variant}
        aria-haspopup="true"
        aria-expanded={isOpen}
        {...props}
        className={clsx(className, { active: isOpen })}
        onClick={() => {
          if (!isOpen) onOpen?.()
          toggleMenuOpen(menuId)
        }}
      />
      <MenuContainer id={menuId} target={anchor} align={align}>
        <Menu menu={items} onClose={() => setMenuOpen(false)} />
      </MenuContainer>
    </>
  )
}
