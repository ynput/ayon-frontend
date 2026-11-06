// The host's useContextMenu (@ynput/ayon-addon): an addon's menu items in AYON's right-click menu.
// Registered with provideHost by the app and the dev shell, which both mount ContextMenuProvider.
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HostOpenContextMenu } from '@ynput/ayon-addon/host'
import type { MenuItemType } from '@shared/components/Menu/Menu'
import {
  useCreateContextMenu,
  type CommandEvent,
  type ContextMenuItemType,
} from '@shared/containers/ContextMenu'
import { toMenuItems } from './AddonButtonHelpers'

/** The shared Menu's items (`toMenuItems`, as `MoreMenu` gets them) as context menu items. */
const toContextMenuItems = (
  items: MenuItemType[],
  navigate: (to: string) => void,
): ContextMenuItemType[] =>
  items.map(({ id, label, icon, disabled, danger, link, target, onClick, items: subItems }) => {
    if (id === 'divider') return { separator: true }
    const command: ((event: CommandEvent) => void) | undefined = disabled
      ? undefined
      : link
        ? () => (target ? window.open(link, target, 'noopener') : navigate(link))
        : onClick && ((event) => onClick(event.originalEvent))
    return {
      label: label as string | undefined,
      icon,
      disabled,
      danger,
      ...(command ? { command } : {}),
      ...(subItems?.length ? { items: toContextMenuItems(subItems, navigate) } : {}),
    }
  })

export const useAddonContextMenu = (): HostOpenContextMenu => {
  const [open] = useCreateContextMenu()
  const navigate = useNavigate()
  return useCallback(
    (event, items, onError) =>
      open(event, toContextMenuItems(toMenuItems(items, onError), navigate)),
    [open, navigate],
  )
}
