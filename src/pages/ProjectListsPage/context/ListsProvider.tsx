import { useState, ReactNode, useMemo, useCallback } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import useNewList from '../hooks/useNewList'
import {
  useCreateEntityListMutation,
  useDeleteEntityListMutation,
  useUpdateEntityListMutation,
} from '@shared/api'
import type { EntityListPatchModel, EntityListPostModel, EntityListSummary } from '@shared/api'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import useDeleteList from '../hooks/useDeleteList'
import useUpdateList from '../hooks/useUpdateList'
import { useListsDataContext } from './ListsDataContext'
import { useQueryParam, withDefault, QueryParamConfig } from 'use-query-params'
import ListsContext, { ListsContextType } from './ListsContext'
import useGetBundleAddonVersions from '@hooks/useGetBundleAddonVersions'

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

interface ListsProviderProps {
  children: ReactNode
  isReview?: boolean
}

export const ListsProvider = ({ children, isReview }: ListsProviderProps) => {
  const { projectName } = useProjectDataContext()
  const { listsMap } = useListsDataContext()

  // Memoize the configurations for the query parameters
  const listParamConfig = useMemo(() => withDefault(RowSelectionParam, {}), [])
  const reviewParamConfig = useMemo(() => withDefault(RowSelectionParam, {}), [])

  const [unstableListSelection, setListSelection] = useQueryParam<RowSelectionState>(
    'list',
    listParamConfig, // Use memoized config
  )
  const [unstableReviewSelection, setReviewSelection] = useQueryParam<RowSelectionState>(
    'review',
    reviewParamConfig, // Use memoized config
  )

  // find out if and what version of the review addon is installed
  const { addonVersions: matchedAddons } = useGetBundleAddonVersions({ addons: ['review'] })
  const reviewVersion = matchedAddons.get('review')

  const rowSelection = useMemo(
    () => (isReview ? unstableReviewSelection : unstableListSelection),
    // Simpler dependencies: unstableListSelection and unstableReviewSelection are stable state references
    [unstableListSelection, unstableReviewSelection, isReview],
  )

  const setRowSelection = useCallback(
    (ids: RowSelectionState) => {
      if (isReview) {
        setReviewSelection(ids)
      } else {
        setListSelection(ids)
      }
    },
    [isReview, setReviewSelection, setListSelection], // setReviewSelection and setListSelection are stable
  )

  // only rows that are selected
  const selectedRows = useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([_k, v]) => v)
        .map(([k]) => k),
    [JSON.stringify(rowSelection)],
  )

  const selectedLists = selectedRows.map((id) => listsMap.get(id)).filter((list) => !!list)

  // we can only ever fetch one list at a time
  const selectedList = selectedLists[0]

  // dialogs
  const [listsFiltersOpen, setListsFiltersOpen] = useState(false)

  const [infoDialogData, setInfoDialogData] = useState<ListsContextType['infoDialogData']>(null)

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
    (list: Pick<EntityListSummary, 'id'>) => {
      if (list.id) {
        setRowSelection({ [list.id]: true })
      }
    },
    [setRowSelection],
  )

  const { closeNewList, createNewList, newList, openNewList, setNewList, createReviewSessionList } =
    useNewList({
      onCreateNewList,
      onCreated: handleCreatedList,
      isReview,
      projectName,
      reviewVersion,
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
  const onDeleteList = async (listId: string) => {
    // delete list in the backend
    await deleteListMutation({ listId, projectName }).unwrap()
    // set the row selection to empty
    setRowSelection({})
  }
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
      createReviewSessionList,
      isCreatingList,
      isReview,
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
    createReviewSessionList,
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
    isReview,
  ])

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>
}
