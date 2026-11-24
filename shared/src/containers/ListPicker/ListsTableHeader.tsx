import { FC, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import styled from 'styled-components'
import { SearchFilterRef } from '@ynput/ayon-react-components'
import { buildSortMenuItem, Menu, MenuContainer, MenuItemType } from '@shared/components/Menu'
import { TableSearch } from '@shared/components/TableSearch'
import { HeaderButton } from '@shared/containers/SimpleTable'
import { useMenuContext, usePowerpack } from '@shared/context'
import { LISTS_SORT_OPTIONS } from '@shared/util/sortLists'
import { useListsDataContext } from './context'
import { useListUserPermissions } from './hooks/useListUserPermissions'
import { parseListFolderRowId } from './util'
import { canDeleteAllFolders, canDeleteAllLists } from './util/listAccessControl'
import ListsFiltersBar from './ListsFiltersBar'
import {
  ListsHeader,
  ListsHeaderButtons,
  ListsHeaderTitle,
  ListsHeaderTop,
} from './ListPicker.styled'

const HeaderTop = styled(ListsHeaderTop)`
  container-type: inline-size;

  /* when this container gets smaller than */
  /* 188px remove folder button (the panel's default width, keep the primary add-list action) */
  @container (max-width: 188px) {
    .add-folder {
      display: none;
    }
  }
  /* 155px remove add-list button */
  @container (max-width: 155px) {
    .add-list {
      display: none;
    }
  }

  /* 125px remove search */
  @container (max-width: 125px) {
    .search-lists {
      display: none;
    }
  }
`

interface ButtonCustomization {
  icon?: string
  tooltip?: string
  shortcut?: string
}

export interface ListsTableHeaderProps {
  title?: string
  isReview?: boolean // review sessions only: the labels name them
  search: string | null
  onSearch: (search: string | null) => void
  selectedRows?: string[] // the selected rows: list ids and folder row ids
  // Each action adds its menu item (and button). Left out, so is the item.
  onSelectAll?: () => void
  onCreateList?: () => void
  onCreateFolder?: () => void
  onDuplicateLists?: (listIds: string[]) => void
  onImportLists?: () => void
  onDeleteLists?: (listIds: string[]) => void
  onDeleteFolders?: (folderIds: string[]) => void
  // a filter item that opens an inline filter bar, stacked below the search input
  filtersBar?: boolean
  // other menu items to leave out, e.g. 'show-archived'
  hiddenMenuItemIds?: string[]
  buttonLabels?: { add?: ButtonCustomization; search?: ButtonCustomization }
  // without one, an id of its own, so a second header (a dialog's) doesn't collide with the page's
  menuId?: string
}

export const ListsTableHeader: FC<ListsTableHeaderProps> = ({
  title,
  isReview = false,
  search,
  onSearch,
  selectedRows = [],
  onSelectAll,
  onCreateList,
  onCreateFolder,
  onDuplicateLists,
  onImportLists,
  onDeleteLists,
  onDeleteFolders,
  filtersBar = false,
  hiddenMenuItemIds = [],
  buttonLabels = {},
  menuId,
}) => {
  const {
    showArchived,
    setShowArchived,
    listsFilters,
    setListsFilters,
    listsSort,
    setListsSort,
    listsData,
    listFolders,
  } = useListsDataContext()
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  const { powerLicense } = usePowerpack()
  const userPermissions = useListUserPermissions()

  const ownMenuId = useId()
  const id = menuId ?? ownMenuId
  const isOpen = menuOpen === id
  const toggleMenu = (open: boolean) => toggleMenuOpen(open ? id : false)

  const filtersBarRef = useRef<SearchFilterRef>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const barVisible = filtersBar && (filtersOpen || listsFilters.length > 0)

  // the bar mounts on the state flip, so the ref is only there next frame
  const openFiltersBar = () => {
    setFiltersOpen(true)
    requestAnimationFrame(() => filtersBarRef.current?.open())
  }

  const closeFiltersBar = () => {
    if (listsFilters.length) setListsFilters([])
    setFiltersOpen(false)
  }

  const selectedListsIds = selectedRows.filter((id) => !parseListFolderRowId(id))
  const selectedFolders = selectedRows
    .filter((id) => !!parseListFolderRowId(id))
    .map((id) => parseListFolderRowId(id)!)

  // Get selected items as full objects for permission checks
  const selectedListsData = useMemo(
    () => listsData.filter((list) => selectedListsIds.includes(list.id)),
    [listsData, selectedListsIds],
  )

  const selectedFoldersData = useMemo(
    () =>
      selectedFolders
        .map((id) => listFolders.find((f) => f.id === id))
        .filter((f): f is NonNullable<typeof f> => !!f),
    [listFolders, selectedFolders],
  )

  // Check if user has permission to delete selected items
  const canDeleteSelection = useMemo(() => {
    if (selectedListsIds.length > 0) {
      return canDeleteAllLists(selectedListsData, userPermissions)
    }
    if (selectedFolders.length > 0) {
      return canDeleteAllFolders(selectedFoldersData, userPermissions)
    }
    return false
  }, [selectedListsIds, selectedFolders, selectedListsData, selectedFoldersData, userPermissions])

  const canDelete = !!(onDeleteLists || onDeleteFolders)
  const handleDelete = () => {
    if (selectedListsIds.length) {
      onDeleteLists?.(selectedListsIds)
    } else if (selectedFolders.length) {
      onDeleteFolders?.(selectedFolders)
    }
  }

  // Define all menu items in order (matching right-to-left button order)
  const menuItems: MenuItemType[] = [
    {
      id: 'search',
      label: 'Search',
      icon: 'search',
      onClick: () => onSearch(''),
      isPinned: true,
      buttonProps: {
        icon: 'search',
        tooltip: isReview ? 'Search review sessions' : 'Search lists',
        ...buttonLabels.search,
      },
      className: 'search-lists',
    },
    ...(onSelectAll
      ? [
          {
            id: 'select-all-lists',
            label: 'Select all lists',
            icon: 'checklist',
            onClick: () => onSelectAll(),
          },
        ]
      : []),
    { id: 'divider' },
    ...(onCreateList
      ? [
          {
            id: 'new-list',
            label: isReview ? 'Create review session' : 'Create list',
            icon: 'add',
            shortcut: 'N',
            onClick: () => onCreateList(),
            isPinned: true,
            buttonProps: {
              icon: 'add',
              tooltip: isReview ? 'Create new review session' : 'Create new list',
              shortcut: 'N',
              ...buttonLabels.add,
            },
            className: 'add-list',
            // a new list goes in one folder
            disabled: selectedFolders.length > 1,
          },
        ]
      : []),
    ...(onCreateFolder
      ? [
          {
            id: 'new-folder',
            label: 'Create folder',
            icon: 'create_new_folder',
            shortcut: 'F',
            onClick: () => onCreateFolder(),
            isPinned: powerLicense,
            powerFeature: 'listFolders' as const,
            buttonProps: {
              icon: 'create_new_folder',
              tooltip: 'Create new folder',
              shortcut: 'F',
            },
            className: 'add-folder',
          },
        ]
      : []),
    ...(onDuplicateLists
      ? [
          {
            id: 'duplicate-list',
            label: 'Duplicate selection',
            icon: 'content_copy',
            onClick: () => onDuplicateLists(selectedListsIds),
            // lists only: a selection with folders in it can't be duplicated
            disabled: !selectedListsIds.length || selectedFolders.length > 0,
          },
        ]
      : []),
    ...(onImportLists
      ? [
          {
            id: 'import-list',
            label: 'Create list from CSV',
            icon: 'upload_file',
            onClick: () => onImportLists(),
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
    ...(filtersBar
      ? [
          {
            id: 'filter',
            label: 'Filter lists',
            icon: 'filter_list',
            onClick: () => {
              if (!barVisible) return openFiltersBar()
              closeFiltersBar()
            },
            selected: listsFilters.length > 0,
            active: listsFilters.length > 0,
          },
        ]
      : []),
    buildSortMenuItem({
      label: 'Sort lists',
      options: LISTS_SORT_OPTIONS,
      sort: listsSort,
      onChange: setListsSort,
    }),
    ...(canDelete
      ? [
          {
            id: 'delete',
            label: 'Delete selection',
            icon: 'delete',
            onClick: handleDelete,
            disabled: selectedRows.length === 0 || !canDeleteSelection,
            danger: true,
          },
        ]
      : []),
  ]

  const filteredMenuItems = hiddenMenuItemIds.length
    ? menuItems.filter((item) => !item.id || !hiddenMenuItemIds.includes(item.id))
    : menuItems

  // leaving items out can leave dividers doubled up or dangling at either end
  const isDivider = (item: MenuItemType) => item.id === 'divider'
  const visibleMenuItems = filteredMenuItems.reduce<MenuItemType[]>((acc, item) => {
    if (isDivider(item) && (!acc.length || isDivider(acc[acc.length - 1]))) return acc
    acc.push(item)
    return acc
  }, [])
  while (visibleMenuItems.length && isDivider(visibleMenuItems[visibleMenuItems.length - 1])) {
    visibleMenuItems.pop()
  }

  // Get pinned items (for buttons)
  const pinnedItems = visibleMenuItems.filter((item) => item.isPinned && item.buttonProps)

  return (
    <ListsHeader>
      <HeaderTop>
        <ListsHeaderTitle>{title ?? (isReview ? 'Review sessions' : 'Lists')}</ListsHeaderTitle>

        <ListsHeaderButtons>
          <HeaderButton
            icon="more_horiz"
            onClick={() => toggleMenu(true)}
            id={id}
            className={clsx('list-menu', { active: isOpen })}
          />
          <MenuContainer targetId={id} id={id} align="left">
            <Menu menu={visibleMenuItems} onClose={() => toggleMenu(false)} />
          </MenuContainer>

          {/* Render pinned items as buttons (in reverse order for right-to-left layout) */}
          {pinnedItems
            .slice()
            .reverse()
            .map((item) => (
              <HeaderButton
                key={item.id}
                icon={item.buttonProps?.icon}
                data-tooltip={item.buttonProps?.tooltip}
                data-shortcut={item.buttonProps?.shortcut}
                onClick={item.onClick}
                className={item.className}
                disabled={item.disabled}
              />
            ))}
        </ListsHeaderButtons>
      </HeaderTop>
      {typeof search === 'string' && (
        <TableSearch value={search} onChange={onSearch} onClose={() => onSearch(null)} />
      )}
      {barVisible && <ListsFiltersBar ref={filtersBarRef} onClose={closeFiltersBar} />}
    </ListsHeader>
  )
}
