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

interface ListsTableHeaderProps {
  title?: string
  search: string | null
  onSearch: (search: string | null) => void
}

const ListsTableHeader: FC<ListsTableHeaderProps> = ({ title = 'Lists', search, onSearch }) => {
  const { openNewList, deleteLists, selectedRows } = useListsContext()

  const handleDelete = () => {
    // delete selected list items
    deleteLists(selectedRows)
  }

  return (
    <HeaderStyled>
      <HeaderTop>
        <StyledTitle>{title}</StyledTitle>

        <StyledButtons>
          {!!selectedRows.length && (
            <HeaderButton
              icon={'delete'}
              onClick={handleDelete}
              data-tooltip="Delete selected lists"
            />
          )}
          <HeaderButton
            icon={'add'}
            data-tooltip={'Create new list'}
            data-shortcut={'N'}
            onClick={() => openNewList()}
          />
          <ListsFiltersButton />
          <HeaderButton
            icon={'search'}
            data-tooltip={'Search lists'}
            onClick={() => typeof search !== 'string' && onSearch('')}
          />
        </StyledButtons>
      </HeaderTop>
      {typeof search === 'string' && (
        <ListsSearch value={search} onChange={onSearch} onClose={() => onSearch(null)} />
      )}
    </HeaderStyled>
  )
}

export default ListsTableHeader
