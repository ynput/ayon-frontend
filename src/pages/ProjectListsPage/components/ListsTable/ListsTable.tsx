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
  // folders-only picker: rows are folders and onRowSubmit receives a folder id
  foldersOnly?: boolean
  singleSelect?: boolean
  hiddenButtons?: ButtonType[]
  onRowSubmit?: (id: string) => void
  onCreateList?: () => void
}

const ListsTable: FC<ListsTableProps> = ({
  isReview,
  isStoryboards,
  rowContextMenuBuilders = [],
  picker = false,
  foldersOnly = false,
  singleSelect = false,
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
  // folder picker opens with search ready — the destination list is often long
  const [clientSearch, setClientSearch] = useState<null | string>(
    picker && foldersOnly ? '' : null,
  )
  // unique menu id in picker mode so the dialog's header menu doesn't collide with the sidepanel's
  const pickerMenuId = useId()

  const rowContextMenuBuildersAll = useListContextMenu(rowContextMenuBuilders, !picker)
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
        const folderId = parseListFolderRowId(id)
        // folders-only picker submits folder rows, the list picker submits list rows
        if (foldersOnly) {
          if (folderId) onRowSubmit?.(folderId)
          return
        }
        // ignore folder rows; double-click a list = instant add + close
        if (folderId) return
        onRowSubmit?.(id)
        return
      }
      setListDetailsOpen(true)
    },
    [picker, foldersOnly, onRowSubmit, setListDetailsOpen],
  )

  const renderCell = useCallback(
    (props: any, row: any) => {
      const listId = row.original.id
      const { isDisabled, disabledMessage, inactive, data } = row.original

      return (
        <SimpleTableCellTemplate
          {...props}
          key={listId}
          iconColor={data.color}
          enableNonFolderIndent={false}
          // no lists are fetched in folders-only mode, so every count would read 0
          badge={
            isDisabled
              ? disabledMessage
              : inactive
              ? '(archived)'
              : foldersOnly
              ? undefined
              : data.count
          }
        />
      )
    },
    [foldersOnly],
  )

  return (
    <>
      <SimpleTableProvider
        {...{ expanded, setExpanded, rowSelection, onRowSelectionChange: setRowSelection }}
      >
        <Container>
          <ListsTableHeader
            title={foldersOnly ? 'Folders' : isReview ? sessionsLabel : undefined}
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
                tooltip: foldersOnly
                  ? 'Search folders'
                  : isReview
                  ? `Search ${sessionsLabel.toLowerCase()}`
                  : 'Search lists',
              },
            }}
            hiddenButtons={hiddenButtons ?? (isReview ? ['filter'] : [])}
            hiddenMenuItemIds={
              picker
                ? [
                    'new-folder',
                    'delete',
                    'filter',
                    ...(onCreateList ? [] : ['new-list']),
                    ...(foldersOnly ? ['select-all-lists', 'show-archived'] : []),
                  ]
                : []
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
            isMultiSelect={!singleSelect}
            enableClickToDeselect={false}
            rowContextMenuBuilders={rowContextMenuBuildersAll}
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
