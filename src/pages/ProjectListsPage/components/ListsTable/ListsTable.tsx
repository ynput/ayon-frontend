import { FC, ReactNode, useState, useCallback } from 'react'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { useListsDataContext } from '@pages/ProjectListsPage/context/lists-data'
import { useProjectContext } from '@shared/context'
import SimpleTable, {
  Container,
  SimpleTableProps,
  SimpleTableProvider,
} from '@shared/containers/SimpleTable'
import { ListsTableCell } from '@shared/containers/ListPicker'
import {
  ListsTableHeader,
  ListsTableHeaderProps,
} from '@shared/containers/ListPicker/ListsTableHeader'
import { useImportDialogContext } from '@containers/ImportDialog/context/ImportDialogProviderInstance'
import NewListDialogContainer from '../NewListDialog/NewListDialogContainer'
import useListContextMenu, {
  ListRowContextMenuBuilder,
} from '@pages/ProjectListsPage/hooks/useListContextMenu'
import ListFolderFormDialog from '../ListFolderFormDialog'
import { parseListFolderRowId } from '@pages/ProjectListsPage/util'

// the page's lists menu (the picker dialog's header gets an id of its own)
const MENU_ID = 'lists-table-menu'

interface ListsTableProps {
  isReview?: boolean
  rowContextMenuBuilders?: ListRowContextMenuBuilder[]
  // picker mode: the folder picker of the move-to-folder dialog (list pickers: shared ListPicker)
  picker?: boolean
  // folders-only picker: rows are folders and onRowSubmit receives a folder id
  foldersOnly?: boolean
  singleSelect?: boolean
  onRowSubmit?: (id: string) => void
  getRowTag?: (listId: string) => ReactNode // shown left of the count
}

const ListsTable: FC<ListsTableProps> = ({
  isReview,
  rowContextMenuBuilders = [],
  picker = false,
  foldersOnly = false,
  singleSelect = false,
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
    selectedRows,
    selectAllLists,
    openNewList,
    onOpenFolderList,
    duplicateLists,
    deleteLists,
    onDeleteListFolders,
  } = useListsContext()
  const { openForContext: openImportDialog } = useImportDialogContext()
  const { listsTableData, isLoadingAll, isError, fetchNextPage } = useListsDataContext()
  // folder picker opens with search ready — the destination list is often long
  const [clientSearch, setClientSearch] = useState<null | string>(picker && foldersOnly ? '' : null)

  // the move-to-folder picker only picks a folder: no list actions
  const listActions: Partial<ListsTableHeaderProps> = picker
    ? {}
    : {
        onCreateList: () => openNewList(),
        onCreateFolder: () => onOpenFolderList({}),
        onDeleteLists: deleteLists,
        onDeleteFolders: onDeleteListFolders,
        // the Reviews page has no duplicate, import or filters
        ...(!isReview && {
          onDuplicateLists: duplicateLists,
          onImportLists: () => openImportDialog('entity_list_item', projectName),
          filtersBar: true,
        }),
      }

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
            title={foldersOnly ? 'Folders' : undefined}
            isReview={isReview}
            search={clientSearch}
            onSearch={setClientSearch}
            selectedRows={selectedRows}
            onSelectAll={foldersOnly ? undefined : () => selectAllLists()}
            {...listActions}
            hiddenMenuItemIds={foldersOnly ? ['show-archived'] : undefined}
            buttonLabels={foldersOnly ? { search: { tooltip: 'Search folders' } } : undefined}
            menuId={picker ? undefined : MENU_ID}
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
