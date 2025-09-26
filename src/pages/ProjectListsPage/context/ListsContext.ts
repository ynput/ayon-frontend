import { createContext, useContext } from 'react'
import { RowSelectionState, ExpandedState } from '@tanstack/react-table'
import { UseNewListReturn } from '../hooks/useNewList'

import { UseDeleteListReturn } from '../hooks/useDeleteList'
import { UseUpdateListReturn } from '../hooks/useUpdateList'
import { EntityList } from '@shared/api'
import { FolderFormData } from '../components/ListFolderFormDialog'

export type ListDetailsOpenState = {
  isOpen: boolean
  folderId?: string // id of folder being edited, undefined for create
  listIds?: string[] // ids of lists to add to folder on create
  initial?: Partial<FolderFormData>
}

export type OnOpenFolderListParams = (params: {
  folderId?: string
  listIds?: string[]
  parentId?: string
}) => void

export interface ListsContextType {
  rowSelection: RowSelectionState
  setRowSelection: (ids: RowSelectionState) => void
  selectedRows: string[]
  selectedLists: EntityList[]
  selectedList: EntityList | undefined
  // meta
  isReview?: boolean
  // expanded state
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
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
  onRenameList: UseUpdateListReturn['onRenameList']
  onPutListsInFolder: UseUpdateListReturn['onPutListsInFolder']
  onRemoveListsFromFolder: UseUpdateListReturn['onRemoveListsFromFolder']
  onCreateListFolder: UseUpdateListReturn['onCreateListFolder']
  onUpdateListFolder: UseUpdateListReturn['onUpdateListFolder']
  onDeleteListFolder: UseUpdateListReturn['onDeleteListFolder']
  onPutFolderInFolder: UseUpdateListReturn['onPutFolderInFolder']
  onRemoveFolderFromFolder: UseUpdateListReturn['onRemoveFolderFromFolder']
  // Deleting lists
  deleteLists: UseDeleteListReturn['deleteLists']
  // Info dialog
  listDetailsOpen: boolean
  setListDetailsOpen: (open: boolean) => void
  // Lists filters dialog
  listsFiltersOpen: boolean
  setListsFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>
  // List folders dialog
  listFolderOpen: ListDetailsOpenState
  setListFolderOpen: React.Dispatch<React.SetStateAction<ListDetailsOpenState>>
  onOpenFolderList: OnOpenFolderListParams
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
