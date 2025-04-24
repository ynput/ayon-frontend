import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import SimpleTable, { Container, SimpleTableProvider } from '@shared/SimpleTable'
import { SimpleTableCellTemplate } from '@shared/SimpleTable/SimpleTableRowTemplate'
import { FC } from 'react'
import * as Styled from './ListsTable.styled'
import ListsTableHeader from './ListsTableHeader'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'

interface ListsTableProps {}

const ListsTable: FC<ListsTableProps> = ({}) => {
  const { expanded, setExpanded, rowSelection, setRowSelection } = useListsContext()
  const { listsTableData, isLoadingAll, isLoadingMore, isError, handleFetchNextPage } =
    useListsDataContext()

  return (
    <>
      <SimpleTableProvider {...{ expanded, setExpanded, rowSelection, setRowSelection }}>
        <Container>
          <ListsTableHeader />
          <SimpleTable
            data={listsTableData}
            isExpandable={false}
            isLoading={isLoadingAll}
            error={isError ? 'Error loading lists' : undefined}
            template={(props, row) => (
              <SimpleTableCellTemplate
                {...props}
                endContent={<Styled.ListCount>{row.original.data.count}</Styled.ListCount>}
              />
            )}
          />
        </Container>
      </SimpleTableProvider>
      <NewListDialogContainer />
    </>
  )
}

export default ListsTable
