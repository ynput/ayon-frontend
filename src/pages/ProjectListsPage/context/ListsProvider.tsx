import { useState, ReactNode, useMemo, useCallback } from 'react'
import { RowSelectionState, ExpandedState } from '@tanstack/react-table'
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
import ListsContext, { ListDetailsOpenState, OnOpenFolderListParams } from './ListsContext'
import useGetBundleAddonVersions from '@hooks/useGetBundleAddonVersions'
import { useLocalStorage } from '@shared/hooks'
import { buildListFolderRowId, parseListFolderRowId } from '../util/buildListsTableData'
import useInitialListsExpanded from '../hooks/useInitialListsExpanded'
import { usePowerpack } from '@shared/context'

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
  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const { projectName } = useProjectDataContext()
  const { listsMap, listsData, listFolders } = useListsDataContext()

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

  const [listDetailsOpen, setListDetailsOpen] = useLocalStorage<boolean>('list-details-open', true)

  const [listFolderOpen, setListFolderOpen] = useState<ListDetailsOpenState>({ isOpen: false })

  // expanded state for folder hierarchy
  const [expanded, setExpanded] = useState<ExpandedState>({})

  useInitialListsExpanded({
    selectedRows,
    lists: listsData,
    listFolders,
    setExpanded,
  })

  // CREATE NEW LIST
  const [createNewListMutation, { isLoading: isCreatingList }] = useCreateEntityListMutation()
  const onCreateNewList = async (list: EntityListPostModel) =>
    await createNewListMutation({ entityListPostModel: list, projectName }).unwrap()

  const handleCreatedList = useCallback(
    (lists: Pick<EntityListSummary, 'id'> | Pick<EntityListSummary, 'id'>[]) => {
      if (Array.isArray(lists)) {
        const newSelection = lists.reduce(
          (acc, list) => ({ ...acc, [list.id as string]: true }),
          {} as RowSelectionState,
        )
        setRowSelection(newSelection)
      } else if (lists.id) {
        setRowSelection({ [lists.id]: true })
      }
    },
    [setRowSelection],
  )

  const handleCreatedFolders = useCallback(
    (folderIds: string[], hadListIds: boolean, parentIds: string[] = []) => {
      if (!folderIds.length) return

      const folderRowIds = folderIds.map((id) => buildListFolderRowId(id))
      const parentFolderRowIds = parentIds.map((id) => buildListFolderRowId(id))

      if (hadListIds || parentIds.length) {
        // Lists were added to the folder, so keep current selection and expand the folder
        setExpanded((prev) => {
          const newExpanded = { ...((prev as Record<string, boolean>) || {}) }
          // expand all parents
          parentFolderRowIds.forEach((id) => {
            newExpanded[id] = true
          })
          // expand all new folders
          folderRowIds.forEach((id) => {
            newExpanded[id] = true
          })
          return newExpanded
        })
      } else {
        // No lists were added to the folder, so select the new folder
        setRowSelection(folderRowIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}))
      }
    },
    [setRowSelection, setExpanded],
  )

  const {
    closeNewList,
    createNewList,
    newList,
    openNewList: rawOpenNewList,
    setNewList,
    createReviewSessionList,
  } = useNewList({
    onCreateNewList,
    onCreated: handleCreatedList,
    isReview,
    projectName,
    reviewVersion,
  })

  // Wrap openNewList to automatically set folder if a folder is selected
  const openNewList = useCallback(
    (init?: Partial<EntityListPostModel & { entityListFolderIds?: string[] }>) => {
      let enhancedInit = { ...init }

      // If no entityListFolderId is explicitly provided, check if folders are selected
      if (
        !enhancedInit.entityListFolderId &&
        !enhancedInit.entityListFolderIds &&
        selectedRows.length > 0
      ) {
        const selectedFolderIds = selectedRows
          .map((id) => parseListFolderRowId(id))
          .filter((id): id is string => !!id)

        if (selectedFolderIds.length > 0) {
          // Folders are selected, set them as the parent folders for the new list(s)
          enhancedInit.entityListFolderIds = selectedFolderIds
          // also remove entityListFolderId if it exists
          delete enhancedInit.entityListFolderId
        }
      }

      rawOpenNewList(enhancedInit)
    },
    [rawOpenNewList, selectedRows],
  )

  // UPDATE/EDIT LIST
  const [updateListMutation] = useUpdateEntityListMutation()
  const onUpdateList = async (listId: string, list: EntityListPatchModel) =>
    await updateListMutation({ listId, entityListPatchModel: list, projectName }).unwrap()
  const {
    closeRenameList,
    openRenameList,
    renamingList,
    onRenameList,
    onPutListsInFolder,
    onRemoveListsFromFolder,
    onCreateListFolder,
    onUpdateListFolder,
    onDeleteListFolders,
    onPutFoldersInFolder,
    onRemoveFoldersFromFolder,
  } = useUpdateList({
    setRowSelection,
    onUpdateList,
    projectName,
    onCreatedFolders: handleCreatedFolders,
  })

  const onOpenFolderList: OnOpenFolderListParams = ({ folderId }) => {
    if (!powerLicense) {
      setPowerpackDialog('listFolders')
      return
    }
    // get folder data
    const folder = listFolders.find((f) => f.id === folderId)
    // if no folderId, open create dialog
    if (!folderId) {
      return setListFolderOpen({
        isOpen: true,
      })
    }

    if (!folder) {
      console.error('Folder not found')
      return
    }

    // open dialog in edit mode
    setListFolderOpen({
      isOpen: true,
      folderId,
      initial: { label: folder.label, parentId: folder.parentId, ...folder.data },
    })
  }

  // DELETE LIST
  const [deleteListMutation] = useDeleteEntityListMutation()
  const onDeleteList = async (listId: string) => {
    // delete list in the backend
    await deleteListMutation({ listId, projectName }).unwrap()
    // set the row selection to empty
    setRowSelection({})
  }
  const { deleteLists } = useDeleteList({ onDeleteList })

  // Helper to select all lists within selected folders (including descendants) or root lists
  const selectAllLists = useCallback(
    ({ rowIds }: { rowIds?: string[] } = {}) => {
      // Use provided rowIds (row ids from table) or fallback to current selectedRows
      const activeRowIds = rowIds ?? selectedRows

      // Extract folder ids from active row ids
      const selectedFolderIds = activeRowIds
        .map((id) => parseListFolderRowId(id))
        .filter((id): id is string => !!id)

      // BFS to collect descendant folder ids
      const getDescendantFolderIds = (folderIds: string[]) => {
        const queue = [...folderIds]
        const result = new Set(folderIds)
        while (queue.length) {
          const current = queue.shift()!
          ;(listFolders || [])
            .filter((f) => f.parentId === current)
            .forEach((child) => {
              if (!result.has(child.id)) {
                result.add(child.id)
                queue.push(child.id)
              }
            })
        }
        return [...result]
      }

      let listsToSelect = [] as EntityListSummary[]

      if (selectedFolderIds.length) {
        const allFolderIds = getDescendantFolderIds(selectedFolderIds)
        // Build a map for quick parent lookup
        const folderMap = new Map<string, (typeof listFolders)[number]>(
          listFolders.map((f) => [f.id, f]),
        )

        // Helper to check if the full ancestor chain is expanded
        const isFolderChainExpanded = (folderId: string): boolean => {
          let currentId: string | undefined = folderId
          while (currentId) {
            const rowId = buildListFolderRowId(currentId)
            // If this folder itself isn't marked expanded and it's not a root in the selection path, stop
            if (!(expanded as Record<string, boolean>)[rowId]) return false
            const parentId: string | undefined = folderMap.get(currentId)?.parentId
            currentId = parentId
          }
          return true
        }

        listsToSelect = listsData.filter((l) => {
          if (!l.entityListFolderId) return false
          if (!allFolderIds.includes(l.entityListFolderId)) return false
          return isFolderChainExpanded(l.entityListFolderId)
        })
      } else {
        // No folders selected: select all root lists (lists without folder)
        listsToSelect = listsData.filter((l) => !l.entityListFolderId)
      }

      const selection = listsToSelect.reduce(
        (acc, l) => ({ ...acc, [l.id as string]: true }),
        {} as RowSelectionState,
      )
      setRowSelection(selection)
    },
    [selectedRows, listsData, listFolders, expanded, setRowSelection],
  )

  return (
    <ListsContext.Provider
      value={{
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
        // expanded state
        expanded,
        setExpanded,
        // list editing
        closeRenameList,
        openRenameList,
        renamingList,
        onRenameList,
        onPutListsInFolder,
        onRemoveListsFromFolder,
        onCreateListFolder,
        onUpdateListFolder,
        onDeleteListFolders,
        onPutFoldersInFolder,
        onRemoveFoldersFromFolder,
        deleteLists,
        // info dialog
        listDetailsOpen,
        setListDetailsOpen,
        // lists filters dialog
        listsFiltersOpen,
        setListsFiltersOpen,
        // list folders dialog
        listFolderOpen,
        setListFolderOpen,
        onOpenFolderList, // helper function to open folder dialog in edit/create mode
        // helpers
        selectAllLists,
      }}
    >
      {children}
    </ListsContext.Provider>
  )
}
