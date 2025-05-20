import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { Header, HeaderButton } from '@shared/SimpleTable'
import { theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { ListsFiltersButton } from './ListsFiltersButton'
import ListsSearch from './ListsSearch'

const HeaderStyled = styled(Header)`
  flex-direction: column;
`

const HeaderTop = styled(Header)`
  padding: 0;
  border: none;
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

interface ListsTableHeaderProps {
  title?: string
  search: string | null
  onSearch: (search: string | null) => void
  buttonLabels?: ButtonsCustomization
  hiddenButtons?: ButtonType[]
}

const ListsTableHeader: FC<ListsTableHeaderProps> = ({
  title = 'Lists',
  search,
  onSearch,
  buttonLabels = {},
  hiddenButtons = [],
}) => {
  const { openNewList, deleteLists, selectedRows } = useListsContext()

  // Default button configurations
  const deleteButton = {
    icon: 'delete',
    tooltip: 'Delete selected lists',
    ...buttonLabels.delete,
  }

  const addButton = {
    icon: 'add',
    tooltip: 'Create new list',
    shortcut: 'N',
    ...buttonLabels.add,
  }

  const searchButton = {
    icon: 'search',
    tooltip: 'Search lists',
    ...buttonLabels.search,
  }

  // Filter button configuration
  const filterButton = {
    icon: 'filter_list',
    filterTooltip: 'Filter lists',
    tooltipDelay: 200,
    ...buttonLabels.filter,
  }

  const handleDelete = () => {
    // delete selected list items
    deleteLists(selectedRows)
  }

  return (
    <HeaderStyled>
      <HeaderTop>
        <StyledTitle>{title}</StyledTitle>

        <StyledButtons>
          {!!selectedRows.length && !hiddenButtons.includes('delete') && (
            <HeaderButton
              icon={deleteButton.icon}
              onClick={handleDelete}
              data-tooltip={deleteButton.tooltip}
              data-shortcut={deleteButton.shortcut}
            />
          )}
          {!hiddenButtons.includes('add') && (
            <HeaderButton
              icon={addButton.icon}
              data-tooltip={addButton.tooltip}
              data-shortcut={addButton.shortcut}
              onClick={() => openNewList()}
            />
          )}
          {!hiddenButtons.includes('filter') && (
            <ListsFiltersButton
              icon={filterButton.icon}
              filterTooltip={filterButton.filterTooltip}
              activeFilterTooltip={filterButton.activeTooltip}
              tooltipDelay={filterButton.tooltipDelay}
            />
          )}
          {!hiddenButtons.includes('search') && (
            <HeaderButton
              icon={searchButton.icon}
              data-tooltip={searchButton.tooltip}
              data-shortcut={searchButton.shortcut}
              onClick={() => typeof search !== 'string' && onSearch('')}
            />
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
