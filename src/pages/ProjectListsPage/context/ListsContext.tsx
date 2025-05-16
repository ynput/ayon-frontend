import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import useNewList, { UseNewListReturn } from '../hooks/useNewList'
import {
  useCreateEntityListMutation,
  useDeleteEntityListMutation,
  useUpdateEntityListMutation,
} from '@shared/api'
import type {
  EntityListPatchModel,
  EntityListPostModel,
  EntityList,
  EntityListSummary,
} from '@shared/api'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import useDeleteList, { UseDeleteListReturn } from '../hooks/useDeleteList'
import useUpdateList, { UseUpdateListReturn } from '../hooks/useUpdateList'
import { useListsDataContext } from './ListsDataContext'
import { useQueryParam, withDefault, QueryParamConfig } from 'use-query-params'

// Custom param for RowSelectionState
const RowSelectionParam: QueryParamConfig<RowSelectionState> = {
  encode: (rowSelection: RowSelectionState | null | undefined) => {
    if (!rowSelection || Object.keys(rowSelection).length === 0) return undefined
    // Convert to array of selected row ids
    const selectedIds = Object.entries(rowSelection)
      .filter(([_, selected]) => selected)
      .map(([id]) => id)
    return selectedIds.join(',')
  },
  decode: (input: string | (string | null)[] | null | undefined) => {
    const str = Array.isArray(input) ? input[0] : input
    if (!str) return {}

    // Convert comma-separated string back to object
    const selectedIds = str.split(',')
    return selectedIds.reduce((acc, id) => ({ ...acc, [id]: true }), {})
  },
}

export interface ListsContextValue {
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  selectedRows: string[]
  selectedLists: EntityList[]
  selectedList: EntityList | undefined
  // Creating new lists
  newList: UseNewListReturn['newList']
  setNewList: UseNewListReturn['setNewList']
  openNewList: UseNewListReturn['openNewList']
  closeNewList: UseNewListReturn['closeNewList']
  createNewList: UseNewListReturn['createNewList']
  isCreatingList: boolean
  // Updating lists
  renamingList: UseUpdateListReturn['renamingList']
  openRenameList: UseUpdateListReturn['openRenameList']
  closeRenameList: UseUpdateListReturn['closeRenameList']
  submitRenameList: UseUpdateListReturn['submitRenameList']
  // Deleting lists
  deleteLists: UseDeleteListReturn['deleteLists']
  // Info dialog
  infoDialogData: null | EntityList
  setInfoDialogData: (list: EntityList | null) => void
  openDetailsPanel: (id: string) => void
  // Lists filters dialog
  listsFiltersOpen: boolean
  setListsFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const ListsContext = createContext<ListsContextValue | undefined>(undefined)

interface ListsProviderProps {
  children: ReactNode
}

export const ListsProvider = ({ children }: ListsProviderProps) => {
  const { projectName } = useProjectDataContext()
  const { listsMap } = useListsDataContext()
  const [unstableRowSelection, setRowSelection] = useQueryParam<RowSelectionState>(
    'list',
    withDefault(RowSelectionParam, {}),
  )
  const rowSelection = useMemo(() => unstableRowSelection, [JSON.stringify(unstableRowSelection)])
  // only rows that are selected
  const selectedRows = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([_k, v]) => v)
        .map(([k]) => k),
    [rowSelection],
  )

  const selectedLists = useMemo(() => {
    // for each selected row, get the list from the map
    // and check it is a list that can be fetched (not a folder)
    return selectedRows.map((id) => listsMap.get(id)).filter((list) => !!list)
  }, [selectedRows])

  // we can only ever fetch one list at a time
  const selectedList = useMemo(() => {
    return selectedLists[0]
  }, [selectedRows, listsMap])

  // dialogs
  const [listsFiltersOpen, setListsFiltersOpen] = useState(false)

  const [infoDialogData, setInfoDialogData] = useState<ListsContextValue['infoDialogData']>(null)

  const openDetailsPanel = useCallback(
    (id: string) => {
      // get the list from the map
      const list = listsMap.get(id)
      if (list) {
        setInfoDialogData(list)
      }
    },
    [listsMap, setInfoDialogData],
  )

  // CREATE NEW LIST
  const [createNewListMutation, { isLoading: isCreatingList }] = useCreateEntityListMutation()
  const onCreateNewList = async (list: EntityListPostModel) =>
    await createNewListMutation({ entityListPostModel: list, projectName }).unwrap()

  const handleCreatedList = useCallback(
    (list: EntityListSummary) => {
      if (list.id) {
        setRowSelection({ [list.id]: true })
      }
    },
    [setRowSelection],
  )

  const { closeNewList, createNewList, newList, openNewList, setNewList } = useNewList({
    onCreateNewList,
    onCreated: handleCreatedList,
  })

  // UPDATE/EDIT LIST
  const [updateListMutation] = useUpdateEntityListMutation()
  const onUpdateList = async (listId: string, list: EntityListPatchModel) =>
    await updateListMutation({ listId, entityListPatchModel: list, projectName }).unwrap()
  const { closeRenameList, openRenameList, renamingList, submitRenameList } = useUpdateList({
    setRowSelection,
    onUpdateList,
  })

  // DELETE LIST
  const [deleteListMutation] = useDeleteEntityListMutation()
  const onDeleteList = async (listId: string) =>
    await deleteListMutation({ listId, projectName }).unwrap()
  const { deleteLists } = useDeleteList({ onDeleteList })

  const value = useMemo(() => {
    return {
      rowSelection,
      setRowSelection,
      selectedRows,
      selectedLists,
      selectedList,
      closeNewList,
      createNewList,
      newList,
      openNewList,
      setNewList,
      isCreatingList,
      // list editing
      closeRenameList,
      openRenameList,
      renamingList,
      submitRenameList,
      deleteLists,
      // info dialog
      infoDialogData,
      setInfoDialogData,
      openDetailsPanel,
      // lists filters dialog
      listsFiltersOpen,
      setListsFiltersOpen,
    }
  }, [
    rowSelection,
    setRowSelection,
    selectedRows,
    selectedLists,
    selectedList,
    // new list
    closeNewList,
    createNewList,
    newList,
    openNewList,
    setNewList,
    isCreatingList,
    closeRenameList,
    openRenameList,
    renamingList,
    submitRenameList,
    deleteLists,
    infoDialogData,
    setInfoDialogData,
    openDetailsPanel,
    listsFiltersOpen,
    setListsFiltersOpen,
  ])

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>
}

export const useListsContext = () => {
  const context = useContext(ListsContext)
  if (context === undefined) {
    throw new Error('useListsContext must be used within a ListsProvider')
  }
  return context
}

export default ListsContext
