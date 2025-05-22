import { useState } from 'react'
import { useListsDataContext } from '../context/ListsDataContext'
import { ListsContextValue } from '../context/ListsContext'
import type { EntityListPatchModel } from '@shared/api'
import { toast } from 'react-toastify'
import { useCallback } from 'react'

export interface UseUpdateListProps {
  setRowSelection: ListsContextValue['setRowSelection']
  onUpdateList: (listId: string, list: EntityListPatchModel) => Promise<void>
}

export interface UseUpdateListReturn {
  renamingList: string | null
  openRenameList: (listId: string) => void
  closeRenameList: () => void
  submitRenameList: (value: string) => Promise<void>
}

const useUpdateList = ({ setRowSelection, onUpdateList }: UseUpdateListProps) => {
  const { listsData } = useListsDataContext()
  const [renamingList, setRenamingList] = useState<UseUpdateListReturn['renamingList']>(null)

  const openRenameList: UseUpdateListReturn['openRenameList'] = useCallback(
    (listId) => {
      // find list by id
      const list = listsData.find((list) => list.id === listId)
      if (!list) return
      setRenamingList(listId)

      // ensure the row is selected
      setRowSelection({ [listId]: true })
    },
    [listsData, setRowSelection],
  )

  const closeRenameList = useCallback(() => {
    setRenamingList(null)
  }, [])

  const submitRenameList: UseUpdateListReturn['submitRenameList'] = useCallback(
    async (value) => {
      if (!renamingList) return Promise.reject()

      try {
        await onUpdateList(renamingList, {
          label: value,
        })
        // close the dialog
        closeRenameList()
      } catch (error: any) {
        console.error('Failed to rename list:', error)
        toast.error(`Failed to rename list: ${error.data?.detail}`)
        throw error
      }
    },
    [renamingList],
  )

  return {
    renamingList,
    openRenameList,
    closeRenameList,
    submitRenameList,
  }
}

export default useUpdateList
