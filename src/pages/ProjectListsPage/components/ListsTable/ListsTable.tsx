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
import { Row, Table } from '@tanstack/react-table'
import useListContextMenu from '@pages/ProjectListsPage/hooks/useListContextMenu'
import ListFolderFormDialog from '../ListFolderFormDialog'

interface ListsTableProps {
  isReview?: boolean
}

const ListsTable: FC<ListsTableProps> = ({ isReview }) => {
  const {
    rowSelection,
    setRowSelection,
    closeRenameList,
    onRenameList,
    renamingList,
    setListDetailsOpen,
    expanded,
    setExpanded,
  } = useListsContext()
  const { listsTableData, isLoadingAll, isError, fetchNextPage } = useListsDataContext()
  const [clientSearch, setClientSearch] = useState<null | string>(null)

  // Define stable event handlers using useCallback
  const handleDoubleClick = useCallback((e: MouseEvent<HTMLSpanElement>) => {
    if (e.detail === 2) {
      e.preventDefault()
      setListDetailsOpen(true)
    }
  }, [])

  const { openContext: handleRowContext } = useListContextMenu()

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
        onDoubleClick={(e) => meta?.handleDoubleClick(e)}
        onKeyDown={props.onKeyDown}
        value={props.value}
        icon={props.icon}
        iconFilled={props.iconFilled}
        iconColor={row.original.data.color}
        inactive={row.original.inactive}
        count={row.original.data.count}
        isRenaming={listId === meta?.renamingList}
        onSubmitRename={(v) => meta?.onRenameList(v)}
        onCancelRename={meta?.closeRenameList}
        onContextMenu={meta?.handleRowContext}
        isTableExpandable={props.isTableExpandable}
        isRowExpandable={row.getCanExpand()}
        isRowExpanded={row.getIsExpanded()}
        onExpandClick={row.getToggleExpandedHandler()}
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
            isReview={isReview}
          />
          <SimpleTable
            data={listsTableData}
            globalFilter={clientSearch ?? undefined}
            isExpandable={listsTableData.some((row) => row.subRows.length > 0)}
            isLoading={isLoadingAll}
            error={isError ? 'Error loading lists' : undefined}
            onScrollBottom={fetchNextPage}
            enableClickToDeselect={false}
            meta={{
              handleRowContext,
              handleDoubleClick,
              closeRenameList,
              onRenameList,
              renamingList,
            }}
          >
            {renderListRow}
          </SimpleTable>
        </Container>
      </SimpleTableProvider>
      <NewListDialogContainer />
      <ListFolderFormDialog />
    </>
  )
}

export default ListsTable
