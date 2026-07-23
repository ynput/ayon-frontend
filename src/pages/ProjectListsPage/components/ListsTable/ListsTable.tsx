import { FC, useState, useMemo, useCallback, useId } from 'react'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import SimpleTable, {
  Container,
  SimpleTableCellTemplate,
  SimpleTableProvider,
} from '@shared/containers/SimpleTable'
import ListsTableHeader, { ButtonType } from './ListsTableHeader'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'
import useListContextMenu, {
  ListRowContextMenuBuilder,
} from '@pages/ProjectListsPage/hooks/useListContextMenu'
import ListFolderFormDialog from '../ListFolderFormDialog'
import { parseListFolderRowId } from '@pages/ProjectListsPage/util'

interface ListsTableProps {
  isReview?: boolean
  isStoryboards?: boolean
  rowContextMenuBuilders?: ListRowContextMenuBuilder[]
  // picker mode: reuse the table inside the add-to-list dialog
  picker?: boolean
  hiddenButtons?: ButtonType[]
  onRowSubmit?: (listId: string) => void
  onCreateList?: () => void
}

const ListsTable: FC<ListsTableProps> = ({
  isReview,
  isStoryboards,
  rowContextMenuBuilders = [],
  picker = false,
  hiddenButtons,
  onRowSubmit,
  onCreateList,
}) => {
  const {
    rowSelection,
    setRowSelection,
    closeRenameList,
    openRenameList,
    onRenameList,
    renamingList,
    setListDetailsOpen,
    expanded,
    setExpanded,
  } = useListsContext()
  const { listsTableData, isLoadingAll, isError, fetchNextPage } = useListsDataContext()
  const [clientSearch, setClientSearch] = useState<null | string>(null)
  // unique menu id in picker mode so the dialog's header menu doesn't collide with the sidepanel's
  const pickerMenuId = useId()

  const rowContextMenuBuildersAll = useListContextMenu(rowContextMenuBuilders)
  const sessionsLabel = useMemo(
    () => (isStoryboards ? 'Storyboards' : 'Review sessions'),
    [isStoryboards],
  )

  const handleRename = useCallback((id: string) => openRenameList(id), [openRenameList])
  const handleSubmitRename = useCallback(
    (_id: string, val: string) => onRenameList(val),
    [onRenameList],
  )
  const handleCancelRename = useCallback(() => closeRenameList(), [closeRenameList])
  const handleRowDoubleClick = useCallback(
    (id: string) => {
      if (picker) {
        // ignore folder rows; double-click a list = instant add + close
        if (parseListFolderRowId(id)) return
        onRowSubmit?.(id)
        return
      }
      setListDetailsOpen(true)
    },
    [picker, onRowSubmit, setListDetailsOpen],
  )

  const renderCell = useCallback((props: any, row: any) => {
    const listId = row.original.id
    const { isDisabled, disabledMessage, inactive, data } = row.original

    return (
      <SimpleTableCellTemplate
        {...props}
        key={listId}
        iconColor={data.color}
        enableNonFolderIndent={false}
        badge={isDisabled ? disabledMessage : inactive ? '(archived)' : data.count}
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
            hiddenButtons={hiddenButtons ?? (isReview ? ['filter'] : [])}
            hiddenMenuItemIds={
              picker ? ['new-folder', 'delete', 'filter', ...(onCreateList ? [] : ['new-list'])] : []
            }
            menuId={picker ? pickerMenuId : undefined}
            onCreateList={onCreateList}
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
            rowContextMenuBuilders={picker ? [] : rowContextMenuBuildersAll}
            renamingId={picker ? undefined : renamingList}
            onRename={picker ? undefined : handleRename}
            onSubmitRename={picker ? undefined : handleSubmitRename}
            onCancelRename={picker ? undefined : handleCancelRename}
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
