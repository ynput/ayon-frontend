import { FC, ReactNode, useState, useCallback, useId } from 'react'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { useListsDataContext } from '@pages/ProjectListsPage/context/lists-data'
import { useProjectContext } from '@shared/context'
import SimpleTable, {
  Container,
  SimpleTableProps,
  SimpleTableProvider,
} from '@shared/containers/SimpleTable'
import { ListsTableCell } from '@shared/containers/ListPicker'
import ListsTableHeader, { ButtonType } from './ListsTableHeader'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'
import useListContextMenu, {
  ListRowContextMenuBuilder,
} from '@pages/ProjectListsPage/hooks/useListContextMenu'
import ListFolderFormDialog from '../ListFolderFormDialog'
import { parseListFolderRowId } from '@pages/ProjectListsPage/util'

interface ListsTableProps {
  isReview?: boolean
  rowContextMenuBuilders?: ListRowContextMenuBuilder[]
  // picker mode: the folder picker of the move-to-folder dialog (list pickers: shared ListPicker)
  picker?: boolean
  // folders-only picker: rows are folders and onRowSubmit receives a folder id
  foldersOnly?: boolean
  singleSelect?: boolean
  hiddenButtons?: ButtonType[]
  onRowSubmit?: (id: string) => void
  getRowTag?: (listId: string) => ReactNode // shown left of the count
}

const ListsTable: FC<ListsTableProps> = ({
  isReview,
  rowContextMenuBuilders = [],
  picker = false,
  foldersOnly = false,
  singleSelect = false,
  hiddenButtons,
  onRowSubmit,
  getRowTag,
}) => {
  const { projectName } = useProjectContext()
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
  // folder picker opens with search ready — the destination list is often long
  const [clientSearch, setClientSearch] = useState<null | string>(picker && foldersOnly ? '' : null)
  // unique menu id in picker mode so the dialog's header menu doesn't collide with the sidepanel's
  const pickerMenuId = useId()

  const rowContextMenuBuildersAll = useListContextMenu(rowContextMenuBuilders, !picker)

  const handleRename = useCallback((id: string) => openRenameList(id), [openRenameList])
  const handleSubmitRename = useCallback(
    (_id: string, val: string) => onRenameList(val),
    [onRenameList],
  )
  const handleCancelRename = useCallback(() => closeRenameList(), [closeRenameList])
  const handleRowDoubleClick = useCallback(
    (id: string) => {
      if (picker) {
        // the folders-only picker submits folder rows
        const folderId = parseListFolderRowId(id)
        if (foldersOnly && folderId) onRowSubmit?.(folderId)
        return
      }
      setListDetailsOpen(true)
    },
    [picker, foldersOnly, onRowSubmit, setListDetailsOpen],
  )

  const renderCell: NonNullable<SimpleTableProps['children']> = useCallback(
    (props, row) => (
      <ListsTableCell
        {...props}
        key={row.id}
        row={row.original}
        hideCount={foldersOnly}
        tag={picker ? undefined : getRowTag?.(row.id)}
      />
    ),
    [foldersOnly, picker, getRowTag],
  )

  return (
    <>
      <SimpleTableProvider
        {...{ expanded, setExpanded, rowSelection, onRowSelectionChange: setRowSelection }}
      >
        <Container>
          <ListsTableHeader
            title={foldersOnly ? 'Folders' : isReview ? 'Review sessions' : undefined}
            buttonLabels={{
              delete: {
                tooltip: isReview ? `Delete selected review sessions` : 'Delete selected lists',
              },
              add: {
                tooltip: isReview ? `Create new review sessions` : 'Create new list',
              },
              search: {
                tooltip: foldersOnly
                  ? 'Search folders'
                  : isReview
                  ? `Search review sessions`
                  : 'Search lists',
              },
            }}
            hiddenButtons={hiddenButtons ?? (isReview ? ['filter'] : [])}
            hiddenMenuItemIds={
              picker
                ? [
                    'new-folder',
                    'import-list',
                    'duplicate-list',
                    'delete',
                    'filter',
                    'new-list',
                    ...(foldersOnly ? ['select-all-lists', 'show-archived'] : []),
                  ]
                : []
            }
            menuId={picker ? pickerMenuId : undefined}
            search={clientSearch}
            onSearch={setClientSearch}
            isReview={isReview}
            filtersBar={!picker && !isReview}
          />
          <SimpleTable
            data={listsTableData}
            globalFilter={clientSearch ?? undefined}
            isExpandable={listsTableData.some((row) => row.subRows.length > 0)}
            isLoading={isLoadingAll}
            error={isError ? 'Error loading lists' : undefined}
            onScrollBottom={fetchNextPage}
            isMultiSelect={!singleSelect}
            enableClickToDeselect={false}
            rowContextMenuBuilders={rowContextMenuBuildersAll}
            addonShortcuts={picker ? undefined : { table: 'listsPanel', projectName }}
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
