import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { Header, HeaderButton } from '@shared/SimpleTable'
import { theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { ListsFiltersButton } from './ListsFiltersButton'

const StyledTitle = styled.span`
  display: flex;
  align-items: center;
  ${theme.labelLarge}
  height: 32px;
  padding-left: 4px;
`

const StyledButtons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

interface ListsTableHeaderProps {}

const ListsTableHeader: FC<ListsTableHeaderProps> = ({}) => {
  const { openNewList, deleteLists, rowSelection } = useListsContext()

  const handleDelete = () => {
    // delete selected list items
    deleteLists(Object.keys(rowSelection))
  }

  return (
    <Header>
      <StyledTitle>Lists</StyledTitle>

      <StyledButtons>
        <HeaderButton
          icon={'delete'}
          disabled={Object.keys(rowSelection).length === 0}
          onClick={handleDelete}
          data-tooltip="Delete selected lists"
        />
        <HeaderButton
          icon={'add'}
          data-tooltip={'Create new list'}
          data-shortcut={'N'}
          onClick={() => openNewList()}
        />
        <ListsFiltersButton />
      </StyledButtons>
    </Header>
  )
}

export default ListsTableHeader
