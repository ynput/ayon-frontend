import { useState } from 'react'
import { LIST_CATEGORY_ATTRIBUTE, useListsDataContext } from '../context/ListsDataContext'
import { ListsContextType } from '../context'
import {
  usePatchAttributeConfigMutation,
  useUpdateEntityListMutation,
  type EntityListPatchModel,
} from '@shared/api'
import { toast } from 'react-toastify'
import { useCallback } from 'react'
import { kebabCase } from 'lodash'

export interface UseUpdateListProps {
  setRowSelection: ListsContextType['setRowSelection']
  onUpdateList: (listId: string, list: EntityListPatchModel) => Promise<void>
  projectName: string
}

export interface UseUpdateListReturn {
  renamingList: string | null
  openRenameList: (listId: string) => void
  closeRenameList: () => void
  submitRenameList: (value: string) => Promise<void>
  setListsCategory: (listIds: string[], category: string | null) => Promise<void>
  createAndAssignCategory: (listIds: string[], categoryLabel: string) => Promise<void>
}

const useUpdateList = ({ setRowSelection, onUpdateList, projectName }: UseUpdateListProps) => {
  const { listsData, categoryAttribute, categories } = useListsDataContext()
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
  const [updateList] = useUpdateEntityListMutation()

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
    [renamingList, onUpdateList, closeRenameList, categoryAttribute, updateAttribute],
  )

  const setListsCategory = useCallback(
    async (listIds: string[], category: string | null) => {
      try {
        const updatePromises = listIds.map((listId) =>
          updateList({
            listId,
            projectName,
            entityListPatchModel: {
              attrib: {
                entityListCategory: category,
              },
            },
          }).unwrap(),
        )

        await Promise.all(updatePromises)

        const message = category
          ? `Category set to "${category}" for ${listIds.length} list${
              listIds.length === 1 ? '' : 's'
            }`
          : `Category removed from ${listIds.length} list${listIds.length === 1 ? '' : 's'}`
        toast.success(message)
      } catch (error: any) {
        console.error('Failed to update categories:', error)
        toast.error(`Failed to update categories: ${error.data?.detail || error.message}`)
        throw error
      }
    },
    [updateList, projectName],
  )

  const createAndAssignCategory = useCallback(
    async (listIds: string[], categoryLabel: string) => {
      // update the attribute config to add the new category

      // generate category name from label
      const categoryValue = kebabCase(categoryLabel)

      // Check if category already exists
      const categoryExists = categories?.some((item) => item.value == categoryValue)
      if (categoryExists) {
        const errorMsg = `Category "${categoryLabel}" already exists`
        console.error(errorMsg)
        toast.error(errorMsg)
        return
      }

      const newEnum = [...categories, { label: categoryLabel, value: categoryValue }]

      try {
        await updateAttribute({
          attributeName: LIST_CATEGORY_ATTRIBUTE,
          attributePatchModel: {
            data: {
              enum: newEnum,
            },
          },
        }).unwrap()

        // now assign the new category to the lists
        await setListsCategory(listIds, categoryValue)

        toast.success(
          `Category "${categoryLabel}" created and assigned to ${listIds.length} list(s)`,
        )
      } catch (error: any) {
        console.error('Failed to create and assign category:', error)
        toast.error(`Failed to create and assign category: ${error.data?.detail || error.message}`)
        throw error
      }
    },
    [categories, setListsCategory, updateAttribute],
  )

  return {
    renamingList,
    openRenameList,
    closeRenameList,
    submitRenameList,
    setListsCategory,
    createAndAssignCategory,
  }
}

export default useUpdateList
