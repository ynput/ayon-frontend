import type { AddonMenuItem, AnyContribution } from '@ynput/ayon-addon'
import type { MenuItemType } from '@shared/components/Menu/Menu'
import type { CommandEvent, ContextMenuItemType } from '@shared/containers/ContextMenu'

/** The slots whose contributions are buttons: header.item, projectTable.toolbarItem. */
export type ButtonSlot = 'header.item' | 'projectTable.toolbarItem'

/**
 * What a button contribution does on click: exactly one is set (checked when the manifest loads),
 * except that a `component` may be a `popover`'s button (the action is then `popover`).
 */
export type ButtonAction = 'to' | 'run' | 'dialog' | 'menu' | 'popover' | 'component'

export const getButtonAction = (contribution: AnyContribution): ButtonAction | undefined =>
  (['to', 'run', 'dialog', 'menu', 'popover', 'component'] as const).find(
    (action) => contribution[action] !== undefined,
  )

// the slot inspector's tags (`contributionTags`), which the SDK's menu entries carry while it is on
const INSPECTOR_TAGS = ['data-ayon-addon', 'data-ayon-slot', 'data-ayon-contribution'] as const

/** The slot inspector's tags of a menu entry, so the menus built from it keep them. */
export const inspectorTags = (item: object): Record<string, string> =>
  Object.fromEntries(
    INSPECTOR_TAGS.flatMap((tag) => {
      const value = (item as Record<string, unknown>)[tag]
      return typeof value === 'string' ? [[tag, value]] : []
    }),
  )

/**
 * An addon's menu entries as the shared Menu's items: `to` and `href` become links (the Menu
 * follows them), and a failing `onClick` goes to `onError` (`reportContributionError`: a toast
 * naming the addon). Used by `menu` buttons and `MoreMenu`.
 */
export const toMenuItems = (
  items: AddonMenuItem[],
  onError: (error: unknown) => void,
): MenuItemType[] =>
  items.map((item, index) => {
    if ('divider' in item) return { id: 'divider' }
    const { id, label, icon, to, href, onClick, items: subItems, disabled, selected, danger } = item
    return {
      id: `${id}-${index}`,
      label,
      icon,
      disabled,
      selected,
      danger,
      ...(to ? { link: to } : href ? { link: href, target: '_blank' } : {}),
      ...(onClick
        ? {
            onClick: () => {
              Promise.resolve().then(onClick).catch(onError)
            },
          }
        : {}),
      ...(subItems?.length ? { items: toMenuItems(subItems, onError) } : {}),
      ...inspectorTags(item),
    }
  })

/** The shared Menu's items (`toMenuItems`, as `MoreMenu` gets them) as context menu items. */
export const toContextMenuItems = (
  items: MenuItemType[],
  navigate: (to: string) => void,
): ContextMenuItemType[] =>
  items.map((item) => {
    const { id, label, icon, disabled, danger, link, target, onClick, items: subItems } = item
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
      ...inspectorTags(item),
    }
  })
