import { FC, useCallback, MouseEvent, useState } from 'react' // Import event types
import { useListsContext } from '@pages/ProjectListsPage/context'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import SimpleTable, {
  Container,
  SimpleTableProvider,
  SimpleTableRow,
  SimpleTableCellTemplateProps,
} from '@shared/containers/SimpleTable'
import ListRow from '../ListRow/ListRow'
import ListsTableHeader from './ListsTableHeader'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'
import { ExpandedState, Row, Table } from '@tanstack/react-table'
import useListContextMenu from '@pages/ProjectListsPage/hooks/useListContextMenu'

interface ListsTableProps {
  isReview?: boolean
}

const ListsTable: FC<ListsTableProps> = ({ isReview }) => {
  const {
    rowSelection,
    setRowSelection,
    openRenameList,
    closeRenameList,
    submitRenameList,
    renamingList,
  } = useListsContext()
  const { listsTableData, isLoadingAll, isError, fetchNextPage } = useListsDataContext()
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [clientSearch, setClientSearch] = useState<null | string>(null)

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
    (
      props: SimpleTableCellTemplateProps,
      row: Row<SimpleTableRow>,
      table: Table<SimpleTableRow>,
    ) => JSX.Element
  >((props, row, table) => {
    const meta = table.options.meta
    const listId = row.original.id

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      props.onClick?.(e)
    }

    return (
      <ListRow
        tabIndex={0}
        key={listId}
        id={listId}
        depth={row.depth}
        className={props.className}
        onClick={handleClick}
        onKeyDown={props.onKeyDown}
        value={props.value}
        icon={props.icon}
        count={row.original.data.count}
        isRenaming={listId === meta?.renamingList}
        onSubmitRename={(v) => meta?.submitRenameList(v)}
        onCancelRename={meta?.closeRenameList}
        onContextMenu={meta?.handleRowContext}
        isTableExpandable={props.isTableExpandable}
        isRowExpandable={row.getCanExpand()}
        isRowExpanded={row.getIsExpanded()}
        onExpandClick={row.getToggleExpandedHandler()}
        pt={{
          value: {
            onClick: (e) => meta?.handleValueDoubleClick(e, listId),
          },
        }}
      />
    )
  }, [])

  return (
    <>
      <SimpleTableProvider
        {...{ expanded, setExpanded, rowSelection, onRowSelectionChange: setRowSelection }}
      >
        <Container>
          <ListsTableHeader
            title={isReview ? 'Review sessions' : undefined}
            buttonLabels={{
              delete: {
                tooltip: isReview ? 'Delete selected review sessions' : 'Delete selected lists',
              },
              add: { tooltip: isReview ? 'Create new review session' : 'Create new list' },
              search: { tooltip: isReview ? 'Search review sessions' : 'Search lists' },
            }}
            hiddenButtons={isReview ? ['filter'] : []}
            search={clientSearch}
            onSearch={setClientSearch}
          />
          <SimpleTable
            data={listsTableData}
            globalFilter={clientSearch ?? undefined}
            isExpandable={listsTableData.some((row) => row.subRows.length > 0)}
            isLoading={isLoadingAll}
            error={isError ? 'Error loading lists' : undefined}
            onScrollBottom={fetchNextPage}
            meta={{
              handleRowContext,
              handleValueDoubleClick,
              closeRenameList,
              submitRenameList,
              renamingList,
            }}
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
