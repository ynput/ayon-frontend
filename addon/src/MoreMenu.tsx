import { useCallback, useContext } from 'react'
import { toast } from 'react-toastify'
import { getHost } from './hostBridge'
import { Missing } from './layout'
import { reportContributionError } from './pieces'
import { SlotReactContext } from './SlotContextInstance'
import type { AddonMenuItem } from './slots'

export interface MoreMenuProps {
  /** the menu's entries: the same items a `menu` piece returns (dividers, submenus, `danger`, ...) */
  items: AddonMenuItem[]
  /** a Material Symbols icon name; `more_horiz` (AYON's "more" button) when not set */
  icon?: string
  /** shown next to the icon; an icon-only button when not set */
  label?: string
  /** shown on hover and read by screen readers; the label, or `More`, when not set */
  tooltip?: string
  /** the button's look, as AYON's `Button`: `text` (default), `surface`, `tonal`, `filled`, `nav` */
  variant?: 'text' | 'surface' | 'tonal' | 'filled' | 'nav' | 'tertiary' | 'danger'
  /** which edge of the button the menu lines up with: `right` (default) or `left` */
  align?: 'left' | 'right'
  disabled?: boolean
  /** on the button */
  className?: string
  /** on the button, for tests */
  'data-testid'?: string
}

/** What the host's `MoreMenu` gets: the addon's props and where to report a failing item. */
export interface HostMoreMenuProps extends MoreMenuProps {
  /** a failing `onClick`: shown as a toast naming the addon */
  onError: (error: unknown) => void
}

/**
 * A button that opens AYON's own menu, for an addon's "more" (…) actions in a page, a panel, a
 * popover or a dialog. The items are the ones a `menu` piece returns; a failing `onClick` is shown
 * as a toast. Escape and a click outside close only the menu, not the popover or dialog around it.
 *
 * ```tsx
 * <MoreMenu
 *   items={[
 *     { id: 'add', label: 'Add time manually', icon: 'more_time', onClick: () => setAdding(true) },
 *     { divider: true },
 *     { id: 'delete', label: 'Delete', icon: 'delete', danger: true, onClick: remove },
 *   ]}
 * />
 * ```
 */
export const MoreMenu = (props: MoreMenuProps) => {
  const contribution = useContext(SlotReactContext)?.contribution
  const onError = useCallback(
    (error: unknown) => {
      if (contribution) return reportContributionError(contribution, error)
      const message = error instanceof Error ? error.message : String(error)
      console.error('[addon] menu item failed', error)
      toast.error(message)
    },
    [contribution],
  )
  const Host = getHost().components?.MoreMenu
  return Host ? <Host {...props} onError={onError} /> : <Missing name="MoreMenu" />
}
