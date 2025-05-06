import { FC, useCallback, MouseEvent } from 'react' // Import event types
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import SimpleTable, { Container, SimpleTableProvider, SimpleTableRow } from '@shared/SimpleTable'
import ListRow from '../ListRow/ListRow'
import ListsTableHeader from './ListsTableHeader'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'
import { SimpleTableCellTemplateProps } from '@shared/SimpleTable/SimpleTableRowTemplate'
import { Row } from '@tanstack/react-table'
import useListContextMenu from '@pages/ProjectListsPage/hooks/useListContextMenu'

interface ListsTableProps {}

const ListsTable: FC<ListsTableProps> = ({}) => {
  const {
    expanded,
    setExpanded,
    rowSelection,
    setRowSelection,
    openRenameList,
    closeRenameList,
    submitRenameList,
    renamingList,
  } = useListsContext()
  const { listsTableData, isLoadingAll, isError } = useListsDataContext()

  // Define stable event handlers using useCallback
  const handleValueDoubleClick = useCallback(
    (e: MouseEvent<HTMLSpanElement>, id: string) => {
      if (e.detail === 2) {
        e.preventDefault()
        openRenameList(id)
      }
    },
    [openRenameList],
  )

  const handleRowContext = useListContextMenu()

  // Memoize the render function for the row (definition remains the same)
  const renderListRow = useCallback<
    (props: SimpleTableCellTemplateProps, row: Row<SimpleTableRow>) => JSX.Element
  >(
    (props, row) => {
      const listId = row.original.id

      return (
        <ListRow
          key={listId}
          id={listId}
          className={props.className}
          onClick={props.onClick}
          onKeyDown={props.onKeyDown}
          value={props.value}
          icon={props.icon}
          count={row.original.data.count}
          isRenaming={listId === renamingList}
          onSubmitRename={(v) => submitRenameList(v)}
          onCancelRename={closeRenameList}
          onContextMenu={handleRowContext}
          pt={{
            value: {
              onClick: (e) => handleValueDoubleClick(e, listId),
            },
          }}
        />
      )
    },
    [renamingList, handleValueDoubleClick, closeRenameList, submitRenameList],
  )

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
          >
            {renderListRow}
          </SimpleTable>
        </Container>
      </SimpleTableProvider>
      <NewListDialogContainer />
    </>
  )
}

export default ListsTable
