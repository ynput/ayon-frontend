// The host's MoreMenu (@ynput/ayon-addon): a button that opens the shared Menu with an addon's
// items, like the details panel's "more" button. Registered with provideHost by the app and the
// dev shell, so it works wherever an addon renders it.
import { useId, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Button } from '@ynput/ayon-react-components'
import type { HostMoreMenuProps } from '@ynput/ayon-addon/host'
import { Menu } from '@shared/components/Menu/Menu'
import { MenuContainer } from '@shared/components/Menu/MenuContainer'
import { useMenuContext } from '@shared/context'
import { toMenuItems } from './AddonButtonHelpers'

export const AddonMoreMenu = ({
  items,
  icon = 'more_horiz',
  label,
  tooltip,
  variant = 'text',
  align = 'right',
  disabled,
  className,
  onError,
  'data-testid': testId,
}: HostMoreMenuProps) => {
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  // one menu is open at a time app-wide: the id keeps two of these apart
  const menuId = `addon-more-menu:${useId()}`
  const isOpen = menuOpen === menuId
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null)
  const menuItems = useMemo(() => toMenuItems(items, onError), [items, onError])
  const title = tooltip || label || 'More'

  return (
    <>
      <Button
        ref={setAnchor}
        // addons name any Material Symbols icon
        icon={icon as never}
        label={label}
        variant={variant}
        disabled={disabled}
        data-tooltip={label && !tooltip ? undefined : title}
        aria-label={title}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={clsx(className, { active: isOpen })}
        data-testid={testId}
        onClick={() => toggleMenuOpen(menuId)}
      />
      <MenuContainer id={menuId} target={anchor} align={align}>
        <Menu menu={menuItems} />
      </MenuContainer>
    </>
  )
}
