import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import SimpleTable, { Container, SimpleTableProvider } from '@shared/SimpleTable'
import { SimpleTableCellTemplate } from '@shared/SimpleTable/SimpleTableRowTemplate'
import { FC } from 'react'
import * as Styled from './ListsTable.styled'
import ListsTableHeader from './ListsTableHeader'

interface ListsTableProps {}

const ListsTable: FC<ListsTableProps> = ({}) => {
  const { ...states } = useListsContext()
  const { listsTableData, isLoadingAll, isLoadingMore, handleFetchNextPage } = useListsDataContext()

  return (
    <SimpleTableProvider {...states}>
      <Container>
        <ListsTableHeader />
        <SimpleTable
          data={listsTableData}
          isExpandable={false}
          isLoading={isLoadingAll}
          template={(props, row) => (
            <SimpleTableCellTemplate
              {...props}
              endContent={<Styled.ListCount>{row.original.data.count}</Styled.ListCount>}
            />
          )}
        />
      </Container>
    </SimpleTableProvider>
  )
}

export default ListsTable
