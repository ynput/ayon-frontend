import { createContext, useContext, useState, ReactNode } from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import useNewList, { UseNewListReturn } from '../hooks/useNewList'
import { useCreateEntityListMutation } from '@queries/lists/updateLists'
import { EntityListPostModel } from '@api/rest/lists'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'

export interface ListsContextValue {
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
  newList: UseNewListReturn['newList']
  setNewList: UseNewListReturn['setNewList']
  openNewList: UseNewListReturn['openNewList']
  closeNewList: UseNewListReturn['closeNewList']
  createNewList: UseNewListReturn['createNewList']
  isCreatingList: boolean
}

const ListsContext = createContext<ListsContextValue | undefined>(undefined)

interface ListsProviderProps {
  children: ReactNode
}

export const ListsProvider = ({ children }: ListsProviderProps) => {
  const { projectName } = useProjectDataContext()
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const [createNewList, { isLoading: isCreatingList }] = useCreateEntityListMutation()
  const onCreateNewList = async (list: EntityListPostModel) =>
    await createNewList({ entityListPostModel: list, projectName }).unwrap()
  const listProps = {
    ...useNewList({ onCreateNewList }),
    isCreatingList,
  }

  return (
    <ListsContext.Provider
      value={{
        rowSelection,
        setRowSelection,
        expanded,
        setExpanded,
        ...listProps,
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
