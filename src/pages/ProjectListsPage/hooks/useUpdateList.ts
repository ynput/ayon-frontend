import { useState } from 'react'
import { LIST_CATEGORY_ATTRIBUTE, useListsDataContext } from '../context/ListsDataContext'
import { ListsContextType } from '../context'
import { usePatchAttributeConfigMutation, type EntityListPatchModel } from '@shared/api'
import { toast } from 'react-toastify'
import { useCallback } from 'react'

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
  const { listsData, categoryAttribute } = useListsDataContext()
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

  const [updateAttribute] = usePatchAttributeConfigMutation()
  const submitRenameList: UseUpdateListReturn['submitRenameList'] = useCallback(
    async (label) => {
      if (!renamingList) return Promise.reject()

      try {
        // Check if this is a category folder
        if (renamingList.startsWith('category-')) {
          // set new label for category enum
          const categoryName = renamingList.replace('category-', '')
          // get category enum from categoryAttribute
          if (!categoryAttribute) throw new Error('Category attribute not found')

          // find the enum item
          const enumItem = categoryAttribute.data.enum?.find((item) => item.value === categoryName)
          if (!enumItem) throw new Error('Category not found in attribute enum')

          // update enums
          const newEnum = categoryAttribute.data.enum?.map((item) =>
            item.value === categoryName ? { ...item, label: label } : item,
          )

          if (!newEnum) throw new Error('Failed to generate new enum for category')

          updateAttribute({
            attributeName: LIST_CATEGORY_ATTRIBUTE,
            attributePatchModel: {
              data: {
                enum: newEnum,
              },
            },
          })
        } else {
          // Regular list renaming
          await onUpdateList(renamingList, {
            label: label,
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
    [renamingList, onUpdateList, closeRenameList],
  )

  return {
    renamingList,
    openRenameList,
    closeRenameList,
    submitRenameList,
  }
}

export default useUpdateList
