import { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import useNewList, { UseNewListReturn } from '../hooks/useNewList'
import {
  useCreateEntityListMutation,
  useDeleteEntityListMutation,
  useUpdateEntityListMutation,
} from '@queries/lists/updateLists'
import { EntityListPatchModel, EntityListPostModel } from '@api/rest/lists'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import useDeleteList, { UseDeleteListReturn } from '../hooks/useDeleteList'
import useUpdateList, { UseUpdateListReturn } from '../hooks/useUpdateList'
import { EntityList } from '@queries/lists/getLists'
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
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
  selectedEntityType: 'folder' | 'task' | 'product' | 'version' | string | undefined // first selected list entity type
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
  const [rowSelection, setRowSelection] = useQueryParam<RowSelectionState>(
    'list',
    withDefault(RowSelectionParam, {}),
  )
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const selectedEntityType = useMemo(
    () => listsMap.get(Object.keys(rowSelection)[0])?.entityType,
    [rowSelection, listsMap],
  )

  // dialogs
  const [listsFiltersOpen, setListsFiltersOpen] = useState(false)

  const [infoDialogData, setInfoDialogData] = useState<ListsContextValue['infoDialogData']>(null)
  const openDetailsPanel = (id: string) => {
    // get the list from the map
    const list = listsMap.get(id)
    if (list) {
      setInfoDialogData(list)
    }
  }

  // CREATE NEW LIST
  const [createNewListMutation, { isLoading: isCreatingList }] = useCreateEntityListMutation()
  const onCreateNewList = async (list: EntityListPostModel) =>
    await createNewListMutation({ entityListPostModel: list, projectName }).unwrap()

  const useNewListProps = useNewList({
    onCreateNewList,
    onCreated: (list) => list.id && setRowSelection({ [list.id]: true }),
  })
  const newListProps = {
    ...useNewListProps,
    isCreatingList,
  }

  // UPDATE/EDIT LIST
  const [updateListMutation] = useUpdateEntityListMutation()
  const onUpdateList = async (listId: string, list: EntityListPatchModel) =>
    await updateListMutation({ listId, entityListPatchModel: list, projectName }).unwrap()
  const useUpdateListProps = useUpdateList({ setRowSelection, onUpdateList })

  // DELETE LIST
  const [deleteListMutation] = useDeleteEntityListMutation()
  const onDeleteList = async (listId: string) =>
    await deleteListMutation({ listId, projectName }).unwrap()
  const { deleteLists } = useDeleteList({ onDeleteList })

  return (
    <ListsContext.Provider
      value={{
        rowSelection,
        setRowSelection,
        expanded,
        setExpanded,
        selectedEntityType,
        ...newListProps,
        ...useUpdateListProps,
        deleteLists,
        // info dialog
        infoDialogData,
        setInfoDialogData,
        openDetailsPanel,
        // lists filters dialog
        listsFiltersOpen,
        setListsFiltersOpen,
      }}
    >
      {children}
    </ListsContext.Provider>
  )
}

export const useListsContext = () => {
  const context = useContext(ListsContext)
  if (context === undefined) {
    throw new Error('useListsContext must be used within a ListsProvider')
  }
  return context
}

export default ListsContext
