import { FC, useState, useMemo, useCallback } from 'react'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import SimpleTable, {
  Container,
  SimpleTableCellTemplate,
  SimpleTableProvider,
} from '@shared/containers/SimpleTable'
import ListsTableHeader from './ListsTableHeader'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'
import useListContextMenu, {
  ListRowContextMenuBuilder,
} from '@pages/ProjectListsPage/hooks/useListContextMenu'
import ListFolderFormDialog from '../ListFolderFormDialog'

interface ListsTableProps {
  isReview?: boolean
  isStoryboards?: boolean
  rowContextMenuBuilders?: ListRowContextMenuBuilder[]
}

const ListsTable: FC<ListsTableProps> = ({
  isReview,
  isStoryboards,
  rowContextMenuBuilders = [],
}) => {
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

  const rowContextMenuBuildersAll = useListContextMenu(rowContextMenuBuilders)
  const sessionsLabel = useMemo(
    () => (isStoryboards ? 'Storyboards' : 'Review sessions'),
    [isStoryboards],
  )

  const handleRename = useCallback((id: string) => onRenameList(id), [onRenameList])
  const handleSubmitRename = useCallback(
    (_id: string, val: string) => onRenameList(val),
    [onRenameList],
  )
  const handleCancelRename = useCallback(() => closeRenameList(), [closeRenameList])
  const handleRowDoubleClick = useCallback(() => setListDetailsOpen(true), [setListDetailsOpen])

  const renderCell = useCallback((props: any, row: any) => {
    const listId = row.original.id

    return (
      <SimpleTableCellTemplate
        {...props}
        key={listId}
        iconColor={row.original.data.color}
        enableNonFolderIndent={false}
        badge={row.original.inactive ? '(archived)' : row.original.data.count}
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
            title={isReview ? sessionsLabel : undefined}
            buttonLabels={{
              delete: {
                tooltip: isReview
                  ? `Delete selected ${sessionsLabel.toLowerCase()}`
                  : 'Delete selected lists',
              },
              add: {
                tooltip: isReview ? `Create new ${sessionsLabel.toLowerCase()}` : 'Create new list',
              },
              search: {
                tooltip: isReview ? `Search ${sessionsLabel.toLowerCase()}` : 'Search lists',
              },
            }}
            hiddenButtons={isReview ? ['filter'] : []}
            search={clientSearch}
            onSearch={setClientSearch}
            isReview={isReview}
            isStoryboards={isStoryboards}
          />
          <SimpleTable
            data={listsTableData}
            globalFilter={clientSearch ?? undefined}
            isExpandable={listsTableData.some((row) => row.subRows.length > 0)}
            isLoading={isLoadingAll}
            error={isError ? 'Error loading lists' : undefined}
            onScrollBottom={fetchNextPage}
            enableClickToDeselect={false}
            rowContextMenuBuilders={rowContextMenuBuildersAll}
            renamingId={renamingList}
            onRename={handleRename}
            onSubmitRename={handleSubmitRename}
            onCancelRename={handleCancelRename}
            onRowDoubleClick={handleRowDoubleClick}
          >
            {renderCell}
          </SimpleTable>
        </Container>
      </SimpleTableProvider>
      <NewListDialogContainer />
      <ListFolderFormDialog />
    </>
  )
}

export default ListsTable
