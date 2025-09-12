import { useState } from 'react'
import { useListsDataContext } from '../context/ListsDataContext'
import { ListsContextType } from '../context'
import type { EntityListPatchModel } from '@shared/api'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import useRenameCategoryFolder from './useRenameCategoryFolder'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'

export interface UseUpdateListProps {
  setRowSelection: ListsContextType['setRowSelection']
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
  const { projectName } = useProjectDataContext()
  const { renameCategoryFolder } = useRenameCategoryFolder({ projectName, listsData })
  const [renamingList, setRenamingList] = useState<UseUpdateListReturn['renamingList']>(null)

  const openRenameList: UseUpdateListReturn['openRenameList'] = useCallback(
    (listId) => {
      // Check if this is a category folder
      if (listId.startsWith('category-')) {
        // Category folder - just set renaming state
        setRenamingList(listId)
        setRowSelection({ [listId]: true })
        return
      }

      // Regular list - find list by id
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
        // Check if this is a category folder
        if (renamingList.startsWith('category-')) {
          const oldCategoryName = renamingList.replace('category-', '')
          await renameCategoryFolder(oldCategoryName, value)
        } else {
          // Regular list renaming
          await onUpdateList(renamingList, {
            label: value,
          })
        }

        // close the dialog
        closeRenameList()
      } catch (error: any) {
        console.error('Failed to rename:', error)
        const errorMessage = renamingList.startsWith('category-')
          ? 'Failed to rename category'
          : 'Failed to rename list'
        toast.error(`${errorMessage}: ${error.data?.detail || error.message}`)
        throw error
      }
    },
    [renamingList, onUpdateList, renameCategoryFolder, closeRenameList],
  )

  return {
    renamingList,
    openRenameList,
    closeRenameList,
    submitRenameList,
  }
}

export default useUpdateList
