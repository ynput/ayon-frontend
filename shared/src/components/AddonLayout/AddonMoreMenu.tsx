// The host's MoreMenu (@ynput/ayon-addon): a button that opens the shared Menu with an addon's
// items, like the details panel's "more" button. Registered with provideHost by the app and the
// dev shell, so it works wherever an addon renders it.
import { useMemo } from 'react'
import type { HostMoreMenuProps } from '@ynput/ayon-addon/host'
import { MoreMenuButton } from '@shared/components/Menu/MoreMenuButton'
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
  const menuItems = useMemo(() => toMenuItems(items, onError), [items, onError])
  const title = tooltip || label || 'More'

  return (
    <MoreMenuButton
      items={menuItems}
      // addons name any Material Symbols icon
      icon={icon as never}
      label={label}
      variant={variant}
      align={align}
      disabled={disabled}
      data-tooltip={label && !tooltip ? undefined : title}
      aria-label={title}
      className={className}
      data-testid={testId}
    />
  )
}
