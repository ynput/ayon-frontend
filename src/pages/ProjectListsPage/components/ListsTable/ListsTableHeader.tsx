import { useListsContext } from '@pages/ProjectListsPage/context'
import { Header, HeaderButton } from '@shared/containers/SimpleTable'
import { theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import ListsSearch from './ListsSearch'
import Menu from '@components/Menu/MenuComponents/Menu'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer'
import { useMenuContext } from '@shared/context/MenuContext'
import { parseListFolderRowId } from '@pages/ProjectListsPage/util'
import clsx from 'clsx'
import { usePowerpack } from '@shared/context'

export const MENU_ID = 'lists-table-menu'

const HeaderStyled = styled(Header)`
  flex-direction: column;
`

const HeaderTop = styled(Header)`
  padding: 0;
  border: none;

  container-type: inline-size;

  /* when this container gets smaller than */
  /* 188px remove add-list button  */
  @container (max-width: 188px) {
    .add-list {
      display: none;
    }
  }
  /* 155px remove folder button */
  @container (max-width: 155px) {
    .add-folder {
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

const StyledTitle = styled.span`
  display: flex;
  align-items: center;
  ${theme.labelLarge}
  height: 32px;
  padding-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
`

const StyledButtons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

interface ButtonCustomization {
  icon?: string
  tooltip?: string
  shortcut?: string
}

interface ButtonsCustomization {
  delete?: ButtonCustomization
  add?: ButtonCustomization
  search?: ButtonCustomization
  filter?: {
    icon?: string
    tooltip?: string
    activeTooltip?: string
    tooltipDelay?: number
  }
}

type ButtonType = 'delete' | 'add' | 'filter' | 'search'

interface MenuItemDefinition {
  id: string
  label?: string
  icon?: string
  shortcut?: string
  onClick?: () => void
  isPinned?: boolean
  disabled?: boolean
  danger?: boolean
  buttonProps?: {
    icon?: string
    tooltip?: string
    shortcut?: string
  }
  className?: string
  hiddenButtonType?: ButtonType
  powerFeature?: string
}

interface ListsTableHeaderProps {
  title?: string
  search: string | null
  onSearch: (search: string | null) => void
  buttonLabels?: ButtonsCustomization
  hiddenButtons?: ButtonType[]
  isReview?: boolean
}

const ListsTableHeader: FC<ListsTableHeaderProps> = ({
  title = 'Lists',
  search,
  onSearch,
  buttonLabels = {},
  hiddenButtons = [],
  isReview = false,
}) => {
  const {
    openNewList,
    onOpenFolderList,
    selectedRows,
    deleteLists,
    onDeleteListFolders,
    setListsFiltersOpen,
    selectAllLists,
  } = useListsContext()

  const { menuOpen, toggleMenuOpen } = useMenuContext()

  const { powerLicense } = usePowerpack()

  const toggleMenu = (open: boolean = true) => {
    toggleMenuOpen(open ? MENU_ID : false)
  }
  const isOpen = menuOpen === MENU_ID

  const selectedListsIds = selectedRows.filter((id) => !parseListFolderRowId(id))
  const selectedFolders = selectedRows
    .filter((id) => !!parseListFolderRowId(id))
    .map((id) => parseListFolderRowId(id)!)

  const handleDelete = () => {
    if (!selectedRows.length) return

    if (selectedListsIds.length) {
      // delete selected list items
      deleteLists(selectedRows)
    } else if (selectedFolders.length) {
      // delete selected folders
      onDeleteListFolders(selectedFolders)
    }
  }

  const handleSelectAllLists = () => selectAllLists()

  // Define all menu items in order (matching right-to-left button order)
  const menuItems: MenuItemDefinition[] = [
    {
      id: 'search',
      label: 'Search',
      icon: 'search',
      onClick: () => onSearch(''),
      isPinned: true,
      buttonProps: {
        icon: 'search',
        tooltip: 'Search lists',
        shortcut: undefined,
        ...buttonLabels.search,
      },
      className: 'search-lists',
      hiddenButtonType: 'search' as ButtonType,
    },
    {
      id: 'select-all-lists',
      label: 'Select all lists',
      icon: 'checklist',
      onClick: handleSelectAllLists,
      isPinned: false,
    },
    { id: 'divider' },
    {
      id: 'new-list',
      label: isReview ? 'Create review session' : 'Create list',
      icon: 'add',
      shortcut: 'N',
      onClick: () => {
        // If a single folder is selected, create list inside that folder
        if (selectedFolders.length === 1) {
          openNewList({ entityListFolderId: selectedFolders[0] })
        } else {
          // No selection or multiple folders, create at root level
          openNewList()
        }
      },
      isPinned: true,
      buttonProps: {
        icon: 'add',
        tooltip: 'Create list',
        shortcut: 'N',
        ...buttonLabels.add,
      },
      className: 'add-list',
      hiddenButtonType: 'add' as ButtonType,
      disabled: selectedFolders.length > 1,
    },
    {
      id: 'new-folder',
      label: 'Create folder',
      icon: 'create_new_folder',
      shortcut: 'F',
      onClick: () => onOpenFolderList({}),
      isPinned: powerLicense,
      powerFeature: 'listFolders',
      buttonProps: {
        icon: 'create_new_folder',
        tooltip: 'Create new folder',
        shortcut: 'F',
      },
      className: 'add-folder',
      hiddenButtonType: 'add' as ButtonType,
    },
    { id: 'divider' },
    ...(!isReview
      ? [
          {
            id: 'filter',
            label: 'Filter lists',
            icon: 'filter_list',
            onClick: () => setListsFiltersOpen(true),
            isPinned: false,
          },
        ]
      : []),

    {
      id: 'delete',
      label: 'Delete selection',
      icon: 'delete',
      onClick: handleDelete,
      isPinned: false,
      disabled: selectedRows.length < 0,
      danger: true,
    },
  ]

  // Get pinned items (for buttons)
  const pinnedItems = menuItems.filter((item) => item.isPinned)

  return (
    <HeaderStyled>
      <HeaderTop>
        <StyledTitle>{title}</StyledTitle>

        <StyledButtons>
          <HeaderButton
            icon="more_horiz"
            onClick={() => toggleMenu?.(true)}
            id={MENU_ID}
            className={clsx('list-menu', { active: isOpen })}
          />
          {/* @ts-expect-error - non TS file */}
          <MenuContainer targetId={MENU_ID} id={MENU_ID} align="left">
            {/* @ts-expect-error - non TS file */}
            <Menu menu={menuItems} onClose={() => toggleMenu?.(false)} />
          </MenuContainer>

          {/* Render pinned items as buttons (in reverse order for right-to-left layout) */}
          {pinnedItems
            .slice()
            .reverse()
            .map(
              (item) =>
                item.hiddenButtonType &&
                !hiddenButtons.includes(item.hiddenButtonType) && (
                  <HeaderButton
                    key={item.id}
                    icon={item.buttonProps?.icon}
                    data-tooltip={item.buttonProps?.tooltip}
                    data-shortcut={item.buttonProps?.shortcut}
                    onClick={item.onClick}
                    className={item.className}
                    disabled={item.disabled}
                  />
                ),
            )}
        </StyledButtons>
      </HeaderTop>
      {typeof search === 'string' && (
        <ListsSearch value={search} onChange={onSearch} onClose={() => onSearch(null)} />
      )}
    </HeaderStyled>
  )
}

export default ListsTableHeader
