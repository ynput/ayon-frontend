import { useCallback, useContext } from 'react'
import type { MouseEvent } from 'react'
import { toast } from 'react-toastify'
import { getHost } from './hostBridge'
import { reportContributionError } from './pieces'
import { SlotReactContext } from './SlotContextInstance'
import type { AddonMenuItem } from './slots'

/** Opens AYON's right-click menu at the event with these items (`useContextMenu`). */
export type OpenContextMenu = (event: MouseEvent, items: AddonMenuItem[]) => void

/** What the host's `useContextMenu` returns: the opener, with where to report a failing item. */
export type HostOpenContextMenu = (
  event: MouseEvent,
  items: AddonMenuItem[],
  onError: (error: unknown) => void,
) => void

/** Where a failing menu item goes: a toast naming the addon of the contribution rendered here. */
export const useMenuErrorHandler = () => {
  const contribution = useContext(SlotReactContext)?.contribution
  return useCallback(
    (error: unknown) => {
      if (contribution) return reportContributionError(contribution, error)
      const message = error instanceof Error ? error.message : String(error)
      console.error('[addon] menu item failed', error)
      toast.error(message)
    },
    [contribution],
  )
}

const useMissingContextMenu = (): HostOpenContextMenu => () =>
  console.error('useContextMenu is not available in this AYON frontend')

/**
 * AYON's right-click menu, with the same items as `MoreMenu` (dividers, submenus, `danger`, ...).
 * Returns the opener: call it from `onContextMenu` with the event and the items. A failing
 * `onClick` is shown as a toast.
 *
 * ```tsx
 * const openContextMenu = useContextMenu()
 * <tr onContextMenu={(e) => openContextMenu(e, [
 *   { id: 'delete', label: 'Delete', icon: 'delete', danger: true, onClick: () => remove(row) },
 * ])} />
 * ```
 */
export const useContextMenu = (): OpenContextMenu => {
  const onError = useMenuErrorHandler()
  // the host registers its implementation once at startup, so every render calls the same hook
  const useHostContextMenu = getHost().useContextMenu ?? useMissingContextMenu
  const open = useHostContextMenu()
  return useCallback((event, items) => open(event, items, onError), [open, onError])
}
