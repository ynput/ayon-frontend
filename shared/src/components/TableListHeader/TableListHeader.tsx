// The header of a table panel (the projects list, the lists table, Review's playlist): a title,
// a "more" menu with every action, and buttons for the pinned ones. The buttons go, last pinned
// first and active ones last, when the panel gets too narrow; the menu still has them all.
// A search row opens below while `search` is a string.
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import type { IconType } from '@ynput/ayon-react-components'
import { Menu, MenuContainer } from '@shared/components/Menu'
import { isMenuDivider } from '@shared/components/Menu/menuSections'
import type { MenuItemType } from '@shared/components/Menu'
import { TableSearch } from '@shared/components/TableSearch'
import { HeaderButton } from '@shared/containers/SimpleTable/SimpleTable.styled'
import { useMenuContext } from '@shared/context'
import * as Styled from './TableListHeader.styled'

/** A menu item's button, when the item is pinned. */
export interface TableListHeaderButtonProps {
  /** a Material Symbols icon name: the item's `icon` when not set */
  icon?: string
  /** the button's tooltip: the item's `label` when not set */
  tooltip?: string
  /** the shortcut shown in its tooltip; the page handles the key itself */
  shortcut?: string
}

/**
 * A menu item that can also be a button in the header. A pinned item with `items` opens them as
 * its own menu, and an `active` one (a sort, a grouping, an open search) is highlighted in the
 * primary colour and stays the longest.
 */
export type TableListHeaderItem = MenuItemType & {
  /** a button in the header too, while there is room for it */
  isPinned?: boolean
  buttonProps?: TableListHeaderButtonProps
}

export interface TableListHeaderProps {
  title?: ReactNode
  /** before the title: a panel's collapse button */
  titleStart?: ReactNode
  /**
   * every action, in menu order. The pinned ones are buttons as well, the first on the right: the
   * last pinned goes first when the header gets narrow
   */
  menuItems: TableListHeaderItem[]
  /** the search text: a string opens the search row, `undefined` or `null` closes it */
  search?: string | null
  /** the search text changes, or `undefined` when the search row closes */
  onSearch?: (search: string | undefined) => void
  /** the menu's id: its own id when not set */
  menuId?: string
  /** the "more" button opens or closes the menu: the header does it when not set */
  onMenuToggle?: (open: boolean) => void
  /** more props for the "more" button: a class, `data-*` attributes */
  moreButtonProps?: { className?: string; [key: `data-${string}`]: string | undefined }
  /** rows below the search (a filters bar) */
  children?: ReactNode
  className?: string
}

// The pinned buttons to hide so the rest fit in `room`: the last pinned goes first, the active
// ones (they show a state) only after all the others.
const buttonsToHide = (row: HTMLElement, room: number) => {
  const buttons = [...row.children] as HTMLElement[]
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0
  const shown = new Set(buttons)
  const width = () =>
    [...shown].reduce((sum, el) => sum + el.offsetWidth, 0) + gap * Math.max(shown.size - 1, 0)
  const lastFirst = [...buttons].reverse()
  const order = [
    ...lastFirst.filter((el) => !el.classList.contains('highlighted')),
    ...lastFirst.filter((el) => el.classList.contains('highlighted')),
  ]
  const hidden: string[] = []
  for (const el of order) {
    if (width() <= room) break
    shown.delete(el)
    if (el.dataset.pinId) hidden.push(el.dataset.pinId)
  }
  return hidden
}

export const TableListHeader = ({
  title,
  titleStart,
  menuItems,
  search,
  onSearch,
  menuId,
  onMenuToggle,
  moreButtonProps,
  children,
  className,
}: TableListHeaderProps) => {
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  const ownMenuId = useId()
  const id = menuId ?? ownMenuId
  const isOpen = menuOpen === id
  const toggleMenu = (open: boolean) =>
    onMenuToggle ? onMenuToggle(open) : toggleMenuOpen(open ? id : false)

  const pinned = menuItems.filter((item) => item.isPinned && !item.hidden && !isMenuDivider(item))
  // the menu spreads an item's fields onto its <li>: keep the button-only ones off it (it drops
  // hidden items and the dividers they leave itself)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const menu = menuItems.map(({ isPinned, buttonProps, ...item }) => item)

  // The buttons that don't fit the header are hidden (the menu has them all), measured after each
  // layout: CSS alone can only drop them from the end, and an active one must stay where it is.
  const buttonsRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef<HTMLDivElement>(null)
  const [hiddenPins, setHiddenPins] = useState<string[]>([])
  const pinnedKey = pinned.map((item) => `${item.id}:${item.active ? 1 : 0}`).join()
  useLayoutEffect(() => {
    const buttons = buttonsRef.current
    const row = pinnedRef.current
    if (!buttons || !row) return
    const fit = () => {
      const more = buttons.querySelector<HTMLElement>('.table-list-header-more')
      const gap = parseFloat(getComputedStyle(buttons).columnGap) || 0
      const room = buttons.clientWidth - (more?.offsetWidth ?? 0) - gap
      const hidden = buttonsToHide(row, room)
      setHiddenPins((prev) => (prev.join() === hidden.join() ? prev : hidden))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(buttons)
    for (const el of row.children) observer.observe(el)
    return () => observer.disconnect()
  }, [pinnedKey])

  return (
    <Styled.Header className={clsx('table-list-header', className)}>
      <Styled.Top className={clsx('table-list-header-top', { 'has-title-start': !!titleStart })}>
        {titleStart}
        <Styled.Title className="table-list-header-title">{title}</Styled.Title>
        <Styled.Buttons ref={buttonsRef} className="table-list-header-buttons">
          <HeaderButton
            icon="more_horiz"
            data-tooltip="More"
            aria-label="More"
            {...moreButtonProps}
            onClick={() => toggleMenu(!isOpen)}
            id={id}
            className={clsx('table-list-header-more', moreButtonProps?.className, {
              active: isOpen,
            })}
          />
          <MenuContainer targetId={id} id={id} align="left">
            <Menu menu={menu} onClose={() => toggleMenu(false)} />
          </MenuContainer>
          {/* right to left, the first pinned on the right */}
          <Styled.Pinned ref={pinnedRef} className="table-list-header-pinned">
            {pinned.map((item) => {
              const label = Array.isArray(item.label) ? item.label.join(' ') : item.label
              const itemMenuId = `${id}-${item.id}`
              const hasMenu = !!item.items?.length
              const menuIsOpen = hasMenu && menuOpen === itemMenuId
              return (
                <HeaderButton
                  key={item.id}
                  data-pin-id={item.id}
                  id={hasMenu ? itemMenuId : undefined}
                  icon={(item.buttonProps?.icon ?? item.icon) as IconType}
                  data-tooltip={item.buttonProps?.tooltip ?? label}
                  data-shortcut={item.buttonProps?.shortcut ?? item.shortcut}
                  aria-label={label}
                  aria-haspopup={hasMenu || undefined}
                  onClick={
                    hasMenu ? () => toggleMenuOpen(menuIsOpen ? false : itemMenuId) : item.onClick
                  }
                  className={clsx(item.className, {
                    highlighted: item.active,
                    active: menuIsOpen,
                    'pin-hidden': hiddenPins.includes(item.id),
                  })}
                  disabled={item.disabled}
                />
              )
            })}
          </Styled.Pinned>
          {/* a pinned item's own menu, under its button */}
          {pinned
            .filter((item) => item.items?.length)
            .map((item) => (
              <MenuContainer
                key={item.id}
                targetId={`${id}-${item.id}`}
                id={`${id}-${item.id}`}
                align="left"
              >
                <Menu menu={item.items!} onClose={() => toggleMenuOpen(false)} />
              </MenuContainer>
            ))}
        </Styled.Buttons>
      </Styled.Top>
      {typeof search === 'string' && onSearch && (
        <TableSearch value={search} onChange={onSearch} onClose={() => onSearch(undefined)} />
      )}
      {children}
    </Styled.Header>
  )
}
