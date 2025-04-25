import { createContext, useContext, useState, ReactNode } from 'react'
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
import { EntityListItem } from '@queries/lists/getLists'
import { useListsDataContext } from './ListsDataContext'

export interface ListsContextValue {
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
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
  deleteList: UseDeleteListReturn['deleteList']
  // Info dialog
  infoDialogData: null | EntityListItem
  setInfoDialogData: (list: EntityListItem | null) => void
  openDetailsPanel: (id: string) => void
}

const ListsContext = createContext<ListsContextValue | undefined>(undefined)

interface ListsProviderProps {
  children: ReactNode
}

export const ListsProvider = ({ children }: ListsProviderProps) => {
  const { projectName } = useProjectDataContext()
  const { listsMap } = useListsDataContext()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
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
  const { deleteList } = useDeleteList({ onDeleteList })

  return (
    <ListsContext.Provider
      value={{
        rowSelection,
        setRowSelection,
        expanded,
        setExpanded,
        ...newListProps,
        ...useUpdateListProps,
        deleteList,
        infoDialogData,
        setInfoDialogData,
        openDetailsPanel,
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
