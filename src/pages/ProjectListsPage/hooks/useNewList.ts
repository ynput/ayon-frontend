import React, { useEffect, useState } from 'react'
import { ListsContextValue as V } from '../context/ListsContext'
import { EntityListPostModel, EntityListSummary } from '@api/rest/lists'
import { toast } from 'react-toastify'

export interface NewListForm extends EntityListPostModel {}

export interface UseNewListProps {
  onCreateNewList: (list: EntityListPostModel) => Promise<EntityListSummary>
}

export interface UseNewListReturn {
  newList: NewListForm | null
  setNewList: React.Dispatch<React.SetStateAction<NewListForm | null>>
  openNewList: (init?: Partial<NewListForm>) => void
  closeNewList: () => void
  createNewList: () => Promise<EntityListSummary>
}

const useNewList = ({ onCreateNewList }: UseNewListProps): UseNewListReturn => {
  const [newList, setNewList] = useState<V['newList']>(null)
  const openNewList: V['openNewList'] = (init) => {
    // generate default name based on date and time
    const date = new Date()
    const defaultName = `List ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
    setNewList({
      label: defaultName,
      entityListType: 'generic',
      entityType: 'folder',
      access: {},
      ...init,
    })
  }
  const closeNewList: V['closeNewList'] = () => setNewList(null)

  const createNewList: V['createNewList'] = async () => {
    if (!newList) return Promise.reject()

    try {
      const res = await onCreateNewList(newList)
      // close the dialog
      closeNewList()

      return res
    } catch (error: any) {
      toast.error(`Failed to create list: ${error.data?.detail}`)
      throw error
    }
  }

  //   open new list with n key shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'n' && !newList) {
        event.preventDefault()
        openNewList()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [newList])

  return {
    newList,
    setNewList,
    openNewList,
    closeNewList,
    createNewList,
  }
}

export default useNewList
