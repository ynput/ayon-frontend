import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { Header, HeaderButton } from '@shared/SimpleTable'
import { theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

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
  const { listsData } = useListsDataContext()
  const { openNewList, deleteList, rowSelection } = useListsContext()

  const handleDelete = () => {
    // get all selected list items
    const selectedListItems = Object.keys(rowSelection)
      .map((key) => {
        const listItem = listsData.find((item) => item.id === key)
        return listItem ? { id: listItem.id, label: listItem.label } : null
      })
      .filter((item) => item !== null)
    // delete selected list items
    deleteList(selectedListItems)
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
        <HeaderButton icon={'filter_list'} />
      </StyledButtons>
    </Header>
  )
}

export default ListsTableHeader
