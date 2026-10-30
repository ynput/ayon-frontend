// Menus of the stand-in surfaces (project list, tables): AYON's context menu with the items the
// addon contributes to the slot, run like AYON runs them (runContribution).
import { useCallback } from 'react'
import type { MouseEvent } from 'react'
import { Button } from '@ynput/ayon-react-components'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import type { AnyContribution, MenuKind, SlotName } from '@ynput/ayon-addon'
import { useCreateContextMenu } from '@ynput/ayon-frontend-shared/ContextMenu'

type MenuContext = Record<string, unknown>

/** Whether a menu item applies to this kind of menu (`in`, both when not set). */
const inMenu = (item: AnyContribution, menu: MenuKind) => {
  const kinds = (item as { in?: MenuKind[] }).in
  return !kinds?.length || kinds.includes(menu)
}

export const useShellMenu = (
  slot: SlotName,
  makeContext: (menu: MenuKind) => MenuContext,
  applies: (item: AnyContribution) => boolean = () => true,
) => {
  const { contributions } = useContributions(slot)
  const [openMenu] = useCreateContextMenu([])

  const itemsFor = useCallback(
    (menu: MenuKind, extra?: MenuContext) => {
      const context = { ...makeContext(menu), ...extra }
      return (contributions as unknown as AnyContribution[])
        .filter((item) => inMenu(item, menu) && applies(item))
        .map((item) => {
          prefetchPiece((item as { run?: () => Promise<unknown> }).run as never)
          return {
            id: item.key,
            label: (item as { label?: string }).label,
            icon: (item as { icon?: string }).icon,
            command: () => runContribution(item as never, context as never),
          }
        })
    },
    [contributions, makeContext, applies],
  )

  const openContextMenu = (e: MouseEvent, extra?: MenuContext) => {
    e.preventDefault()
    const items = itemsFor('context', extra)
    if (items.length) openMenu(e, items)
  }

  const hasDropdownItems = (contributions as unknown as AnyContribution[]).some(
    (item) => inMenu(item, 'dropdown') && applies(item),
  )
  const dropdown = hasDropdownItems ? (
    <Button
      icon="more_vert"
      variant="text"
      data-shell-menu="dropdown"
      onClick={(e) => openMenu(e, itemsFor('dropdown'))}
    />
  ) : null

  return { openContextMenu, dropdown, itemsFor }
}
