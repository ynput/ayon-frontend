import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import type { EntityList } from '@shared/api'
import SimpleTable, {
  Container,
  SimpleTableProps,
  SimpleTableProvider,
} from '@shared/containers/SimpleTable'
import { DEFAULT_LISTS_SORT, ListsSort } from '@shared/util/sortLists'
import { ListsDataProvider, useListsDataContext } from './context'
import { useInitialListsExpanded } from './hooks'
import { getListsToSelectAll, getNewListFolderId, parseListFolderRowId } from './util'
import { ListPickerHeader } from './ListPickerHeader'
import { ListsTableCell } from './ListsTableCell'
import { PickerTableContainer } from './ListPicker.styled'

const ALL_LIST_TYPES = ['generic', 'review-session']

export interface ListPickerProps {
  entityListTypes?: string[] // the list types shown: 'generic', 'review-session' (default both)
  multiSelect?: boolean
  initialSelection?: string[] // list ids, selected when the picker opens; the first is scrolled to
  listFilter?: (list: EntityList) => boolean // lists left out entirely
  isListDisabled?: (list: EntityList) => string | undefined // why a list can't be picked (shown)
  onSelect?: (lists: EntityList[]) => void // the picked lists, when the selection changes
  onSubmit?: (lists: EntityList[]) => void // double-click on a list, or Enter: the lists picked
  // shows a create button; folderId is the folder a new list starts in (the selected folder, else
  // the folder of the selected list)
  onCreateList?: (folderId?: string) => void
  title?: string
}

const toSelection = (ids: string[] = []): RowSelectionState =>
  Object.fromEntries(ids.map((id) => [id, true]))

// The lists of the project in context (ListPickerDialog brings one), as the Lists page shows them,
// to pick from. Folder rows can be selected (to create a list in them) but are never picked.
export const ListPicker: FC<ListPickerProps> = ({
  entityListTypes = ALL_LIST_TYPES,
  listFilter,
  isListDisabled,
  ...props
}) => {
  // the picker's own sort, the Lists page's is saved in its view
  const [listsSort, setListsSort] = useState<ListsSort>(DEFAULT_LISTS_SORT)
  const isReview = entityListTypes.length === 1 && entityListTypes[0] === 'review-session'

  return (
    <ListsDataProvider
      picker
      entityListTypes={entityListTypes}
      listsFilter={listFilter}
      listDisabled={isListDisabled}
      listsSort={listsSort}
      setListsSort={setListsSort}
    >
      <ListPickerTable {...props} isReview={isReview} />
    </ListsDataProvider>
  )
}

const ListPickerTable: FC<
  Omit<ListPickerProps, 'entityListTypes' | 'listFilter' | 'isListDisabled'> & {
    isReview: boolean
  }
> = ({
  multiSelect,
  initialSelection,
  onSelect,
  onSubmit,
  onCreateList,
  title,
  isReview,
}) => {
  const {
    listsData,
    listsMap,
    listFolders,
    listsTableData,
    disabledListIds,
    isLoadingAll,
    isError,
    fetchNextPage,
  } = useListsDataContext()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(() =>
    toSelection(initialSelection),
  )
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [search, setSearch] = useState<string | null>(null)

  const selectedRows = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  )
  const selectedFolderIds = selectedRows
    .map((id) => parseListFolderRowId(id))
    .filter((id): id is string => !!id)
  const selectedLists = selectedRows
    .map((id) => listsMap.get(id))
    .filter((list): list is EntityList => !!list)
  const pickedLists = selectedLists.filter((list) => !disabledListIds.has(list.id))

  // open the folders of the lists selected when it opens
  useInitialListsExpanded({ selectedRows, lists: listsData, listFolders, setExpanded })

  // report the picked lists once they change (their ids), not on every render
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const pickedKey = pickedLists.map((list) => list.id).join(',')
  useEffect(() => {
    onSelectRef.current?.(pickedLists)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedKey])

  const submit = (lists: EntityList[]) => {
    if (lists.length) onSubmit?.(lists)
  }

  const handleRowDoubleClick = (id: string) => {
    // double-click also reaches rows that can't be selected: folders and disabled lists
    const list = listsMap.get(id)
    if (list && !disabledListIds.has(id)) submit([list])
  }

  const handleSelectAll = () =>
    setRowSelection(
      toSelection(
        getListsToSelectAll({
          rowIds: selectedRows,
          lists: listsData,
          folders: listFolders,
          expanded,
          disabledListIds,
        }).map((list) => list.id),
      ),
    )

  const renderCell: NonNullable<SimpleTableProps['children']> = useCallback(
    (cellProps, row) => <ListsTableCell {...cellProps} key={row.id} row={row.original} />,
    [],
  )

  return (
    <PickerTableContainer
      // capture: the rows take Enter to select themselves
      onKeyDownCapture={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).closest('tr')) submit(pickedLists)
      }}
    >
      <SimpleTableProvider
        {...{ expanded, setExpanded, rowSelection, onRowSelectionChange: setRowSelection }}
      >
        <Container>
          <ListPickerHeader
            title={title ?? (isReview ? 'Review sessions' : 'Lists')}
            isReview={isReview}
            search={search}
            onSearch={setSearch}
            onSelectAll={multiSelect ? handleSelectAll : undefined}
            onCreateList={
              onCreateList &&
              (() => onCreateList(getNewListFolderId(selectedFolderIds, selectedLists)))
            }
            // a new list goes in one folder
            createDisabled={selectedFolderIds.length > 1}
          />
          <SimpleTable
            data={listsTableData}
            globalFilter={search ?? undefined}
            isExpandable={listsTableData.some((row) => row.subRows.length > 0)}
            isLoading={isLoadingAll}
            error={isError ? 'Error loading lists' : undefined}
            onScrollBottom={fetchNextPage}
            scrollToRowId={initialSelection?.[0]}
            isMultiSelect={!!multiSelect}
            enableClickToDeselect={false}
            onRowDoubleClick={handleRowDoubleClick}
          >
            {renderCell}
          </SimpleTable>
        </Container>
      </SimpleTableProvider>
    </PickerTableContainer>
  )
}
