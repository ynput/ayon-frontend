import { FC, useMemo, useRef, useState } from 'react'
import { SearchFilterRef } from '@ynput/ayon-react-components'
import { buildSortMenuItem } from '@shared/components/Menu'
import { TableListHeader } from '@shared/components/TableListHeader'
import type { TableListHeaderItem } from '@shared/components/TableListHeader'
import { usePowerpack } from '@shared/context'
import { LISTS_SORT_OPTIONS } from '@shared/util/sortLists'
import { useListsDataContext } from './context'
import { useListUserPermissions } from './hooks/useListUserPermissions'
import { parseListFolderRowId } from './util'
import { canDeleteAllFolders, canDeleteAllLists } from './util/listAccessControl'
import ListsFiltersBar from './ListsFiltersBar'

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
  const { powerLicense } = usePowerpack()
  const userPermissions = useListUserPermissions()

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
  const menuItems: TableListHeaderItem[] = [
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

  const visibleMenuItems = hiddenMenuItemIds.length
    ? menuItems.filter((item) => !hiddenMenuItemIds.includes(item.id))
    : menuItems

  return (
    <TableListHeader
      title={title ?? (isReview ? 'Review sessions' : 'Lists')}
      menuItems={visibleMenuItems}
      menuId={menuId}
      moreButtonProps={{ className: 'list-menu' }}
      search={search}
      onSearch={(value) => onSearch(value ?? null)}
    >
      {barVisible && <ListsFiltersBar ref={filtersBarRef} onClose={closeFiltersBar} />}
    </TableListHeader>
  )
}
