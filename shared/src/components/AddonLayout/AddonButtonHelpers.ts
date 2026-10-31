import type { AddonMenuItem, AnyContribution } from '@ynput/ayon-addon'
import type { MenuItemType } from '@shared/components/Menu/Menu'

/** The slots whose contributions are buttons: header.item, projectTable.toolbarItem. */
export type ButtonSlot = 'header.item' | 'projectTable.toolbarItem'

/** What a button contribution does on click: exactly one is set (checked when the manifest loads). */
export type ButtonAction = 'to' | 'run' | 'dialog' | 'menu' | 'component'

export const getButtonAction = (contribution: AnyContribution): ButtonAction | undefined =>
  (['to', 'run', 'dialog', 'menu', 'component'] as const).find(
    (action) => contribution[action] !== undefined,
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
    }
  })
