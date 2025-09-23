import { createContext, useContext } from 'react'
import { RowSelectionState } from '@tanstack/react-table'
import { UseNewListReturn } from '../hooks/useNewList'

import { UseDeleteListReturn } from '../hooks/useDeleteList'
import { UseUpdateListReturn } from '../hooks/useUpdateList'
import { EntityList } from '@shared/api'

export interface ListsContextType {
  rowSelection: RowSelectionState
  setRowSelection: (ids: RowSelectionState) => void
  selectedRows: string[]
  selectedLists: EntityList[]
  selectedList: EntityList | undefined
  // meta
  isReview?: boolean
  // Creating new lists
  newList: UseNewListReturn['newList']
  setNewList: UseNewListReturn['setNewList']
  openNewList: UseNewListReturn['openNewList']
  closeNewList: UseNewListReturn['closeNewList']
  createNewList: UseNewListReturn['createNewList']
  createReviewSessionList: UseNewListReturn['createReviewSessionList']
  isCreatingList: boolean
  // Updating lists
  renamingList: UseUpdateListReturn['renamingList']
  openRenameList: UseUpdateListReturn['openRenameList']
  closeRenameList: UseUpdateListReturn['closeRenameList']
  submitRenameList: UseUpdateListReturn['submitRenameList']
  setListsCategory: UseUpdateListReturn['setListsCategory']
  createAndAssignCategory: UseUpdateListReturn['createAndAssignCategory']
  editCategory: UseUpdateListReturn['editCategory']
  // Deleting lists
  deleteLists: UseDeleteListReturn['deleteLists']
  // Info dialog
  listDetailsOpen: boolean
  setListDetailsOpen: (open: boolean) => void
  // Lists filters dialog
  listsFiltersOpen: boolean
  setListsFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const ListsContext = createContext<ListsContextType | undefined>(undefined)

export const useListsContext = () => {
  const context = useContext(ListsContext)
  if (context === undefined) {
    throw new Error('useListsContext must be used within a ListsProvider')
  }
  return context
}

export default ListsContext
