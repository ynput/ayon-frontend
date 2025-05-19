import React, { useEffect, useState } from 'react'
import { ListsContextValue as V } from '../context/ListsContext'
import type { EntityListPostModel, EntityListSummary } from '@shared/api'
import { toast } from 'react-toastify'

export interface NewListForm extends EntityListPostModel {}

export interface UseNewListProps {
  onCreateNewList: (list: EntityListPostModel) => Promise<EntityListSummary>
  onCreated?: (list: EntityListSummary) => void
}

export interface UseNewListReturn {
  newList: NewListForm | null
  setNewList: React.Dispatch<React.SetStateAction<NewListForm | null>>
  openNewList: (init?: Partial<NewListForm>) => void
  closeNewList: () => void
  createNewList: () => Promise<EntityListSummary>
}

export const listDefaultName = () => {
  const date = new Date()
  return `List ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const useNewList = ({ onCreateNewList, onCreated }: UseNewListProps): UseNewListReturn => {
  const [newList, setNewList] = useState<V['newList']>(null)
  const openNewList: V['openNewList'] = React.useCallback((init) => {
    // generate default name based on date and time

    setNewList({
      label: listDefaultName(),
      entityListType: 'generic',
      entityType: 'folder',
      access: {},
      ...init,
    })
  }, [])

  const closeNewList: V['closeNewList'] = React.useCallback(() => setNewList(null), [])

  const createNewList: V['createNewList'] = React.useCallback(async () => {
    if (!newList) return Promise.reject()

    try {
      const res = await onCreateNewList(newList)
      // close the dialog
      closeNewList()

      onCreated?.(res)
      return res
    } catch (error: any) {
      toast.error(`Failed to create list: ${error.data?.detail}`)
      throw error
    }
  }, [newList, closeNewList, onCreated])

  //   open new list with n key shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // check we are not in an input field
      if (event.target instanceof HTMLInputElement) return

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
