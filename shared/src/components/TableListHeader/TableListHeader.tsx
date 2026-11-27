// The header of a table panel (the projects list, the lists table, Review's playlist): a title,
// a "more" menu with every action, and buttons for the pinned ones. The buttons go, last pinned
// first, when the panel gets too narrow; CSS alone does it, and the menu still has them all.
// A search row opens below while `search` is a string.
import { useId, type ReactNode } from 'react'
import clsx from 'clsx'
import { Menu, MenuContainer } from '@shared/components/Menu'
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

/** A menu item that can also be a button in the header. */
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

const isDivider = (item: MenuItemType) => item.id === 'divider' || item.separator === true

// leaving items out can leave dividers doubled up or dangling at either end
const tidyDividers = (items: TableListHeaderItem[]) => {
  const tidy = items.reduce<TableListHeaderItem[]>((acc, item) => {
    if (item.hidden) return acc
    if (isDivider(item) && (!acc.length || isDivider(acc[acc.length - 1]))) return acc
    acc.push(item)
    return acc
  }, [])
  while (tidy.length && isDivider(tidy[tidy.length - 1])) tidy.pop()
  return tidy
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

  const items = tidyDividers(menuItems)
  const pinned = items.filter((item) => item.isPinned && !isDivider(item))
  // the menu spreads an item's fields onto its <li>: keep the button-only ones off it
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const menu = items.map(({ isPinned, buttonProps, ...item }) => item)

  return (
    <Styled.Header className={clsx('table-list-header', className)}>
      <Styled.Top className="table-list-header-top">
        {titleStart}
        <Styled.Title className="table-list-header-title">{title}</Styled.Title>
        <Styled.Buttons className="table-list-header-buttons">
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
          {/* right to left: the ones that don't fit wrap onto the row the header hides */}
          <Styled.Pinned className="table-list-header-pinned">
            {pinned.map((item) => {
              const label = Array.isArray(item.label) ? item.label.join(' ') : item.label
              return (
                <HeaderButton
                  key={item.id}
                  icon={item.buttonProps?.icon ?? item.icon}
                  data-tooltip={item.buttonProps?.tooltip ?? label}
                  data-shortcut={item.buttonProps?.shortcut ?? item.shortcut}
                  aria-label={label}
                  onClick={item.onClick}
                  className={clsx(item.className, { active: item.active })}
                  disabled={item.disabled}
                />
              )
            })}
          </Styled.Pinned>
        </Styled.Buttons>
      </Styled.Top>
      {typeof search === 'string' && onSearch && (
        <TableSearch value={search} onChange={onSearch} onClose={() => onSearch(undefined)} />
      )}
      {children}
    </Styled.Header>
  )
}
