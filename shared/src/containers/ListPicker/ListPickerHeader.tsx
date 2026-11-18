import { FC, useId } from 'react'
import clsx from 'clsx'
import { buildSortMenuItem, Menu, MenuContainer, MenuItemType } from '@shared/components/Menu'
import { TableSearch } from '@shared/components/TableSearch'
import { HeaderButton } from '@shared/containers/SimpleTable'
import { useMenuContext } from '@shared/context'
import { LISTS_SORT_OPTIONS } from '@shared/util/sortLists'
import { useListsDataContext } from './context'
import * as Styled from './ListPicker.styled'

interface ListPickerHeaderProps {
  title: string
  isReview?: boolean // review sessions only: the buttons name them
  search: string | null
  onSearch: (search: string | null) => void
  onSelectAll?: () => void
  onCreateList?: () => void
  createDisabled?: boolean
}

// The Lists page's lists header, with what picking needs: search, select all, create, show
// archived and sort.
export const ListPickerHeader: FC<ListPickerHeaderProps> = ({
  title,
  isReview,
  search,
  onSearch,
  onSelectAll,
  onCreateList,
  createDisabled,
}) => {
  const { showArchived, setShowArchived, listsSort, setListsSort } = useListsDataContext()
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  // a menu id of its own, so it doesn't collide with the Lists page's menu behind the dialog
  const menuId = useId()
  const isOpen = menuOpen === menuId

  const openSearch = () => onSearch('')
  const createLabel = isReview ? 'Create review session' : 'Create list'

  const menuItems: MenuItemType[] = [
    { id: 'search', label: 'Search', icon: 'search', onClick: openSearch },
    ...(onSelectAll
      ? [{ id: 'select-all-lists', label: 'Select all lists', icon: 'checklist', onClick: onSelectAll }]
      : []),
    ...(onCreateList
      ? [
          { id: 'divider' },
          {
            id: 'new-list',
            label: createLabel,
            icon: 'add',
            shortcut: 'N',
            onClick: onCreateList,
            disabled: createDisabled,
          },
        ]
      : []),
    { id: 'divider' },
    {
      id: 'show-archived',
      label: 'Show archived',
      icon: 'inventory_2',
      onClick: () => setShowArchived(!showArchived),
      selected: showArchived,
      active: showArchived,
    },
    buildSortMenuItem({
      label: 'Sort lists',
      options: LISTS_SORT_OPTIONS,
      sort: listsSort,
      onChange: setListsSort,
    }),
  ]

  return (
    <Styled.ListsHeader>
      <Styled.ListsHeaderTop>
        <Styled.ListsHeaderTitle>{title}</Styled.ListsHeaderTitle>
        <Styled.ListsHeaderButtons>
          <HeaderButton
            icon="more_horiz"
            onClick={() => toggleMenuOpen(menuId)}
            id={menuId}
            className={clsx('list-menu', { active: isOpen })}
          />
          <MenuContainer targetId={menuId} id={menuId} align="left">
            <Menu menu={menuItems} onClose={() => toggleMenuOpen(false)} />
          </MenuContainer>
          {onCreateList && (
            <HeaderButton
              icon="add"
              data-tooltip={isReview ? 'Create new review sessions' : 'Create new list'}
              data-shortcut="N"
              onClick={onCreateList}
              className="add-list"
              disabled={createDisabled}
            />
          )}
          <HeaderButton
            icon="search"
            data-tooltip={isReview ? 'Search review sessions' : 'Search lists'}
            onClick={openSearch}
            className="search-lists"
          />
        </Styled.ListsHeaderButtons>
      </Styled.ListsHeaderTop>
      {typeof search === 'string' && (
        <TableSearch value={search} onChange={onSearch} onClose={() => onSearch(null)} />
      )}
    </Styled.ListsHeader>
  )
}
