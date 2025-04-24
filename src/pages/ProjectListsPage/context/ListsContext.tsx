import { createContext, useContext, useState, ReactNode } from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import useNewList, { UseNewListReturn } from '../hooks/useNewList'
import {
  useCreateEntityListMutation,
  useDeleteEntityListMutation,
} from '@queries/lists/updateLists'
import { EntityListPostModel } from '@api/rest/lists'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import useDeleteList, { UseDeleteListReturn } from '../hooks/useDeleteList'

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
  // Deleting lists
  deleteList: UseDeleteListReturn['deleteList']
}

const ListsContext = createContext<ListsContextValue | undefined>(undefined)

interface ListsProviderProps {
  children: ReactNode
}

export const ListsProvider = ({ children }: ListsProviderProps) => {
  const { projectName } = useProjectDataContext()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

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
        deleteList,
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
