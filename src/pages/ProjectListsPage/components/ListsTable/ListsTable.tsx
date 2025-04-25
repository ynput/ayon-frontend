import { FC, useCallback, MouseEvent } from 'react' // Import event types
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import SimpleTable, { Container, SimpleTableProvider, SimpleTableRow } from '@shared/SimpleTable'
import ListRow from '../ListRow/ListRow'
import ListsTableHeader from './ListsTableHeader'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'
import { SimpleTableCellTemplateProps } from '@shared/SimpleTable/SimpleTableRowTemplate'
import { Row, RowSelectionState } from '@tanstack/react-table'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'

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
    openDetailsPanel,
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

  // create the ref and model
  const [ctxMenuShow] = useCreateContextMenu()

  const handleRowContext = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    let newSelection: RowSelectionState = { ...rowSelection }
    // if we are selecting a row outside of the selection (or none), set the selection to the row
    if (!newSelection[e.currentTarget.id]) {
      newSelection = { [e.currentTarget.id]: true }
      setRowSelection(newSelection)
    }
    const firstSelectedRow = Object.keys(newSelection)[0]
    const multipleSelected = Object.keys(newSelection).length > 1

    const menuItems: any[] = [
      {
        label: 'Info',
        icon: 'info',
        command: () => openDetailsPanel(firstSelectedRow),
        disabled: multipleSelected,
      },
    ]

    ctxMenuShow(e, menuItems)
  }

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
