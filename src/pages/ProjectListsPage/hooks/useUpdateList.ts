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
import { useAppSelector } from '@state/store'

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
  createAndAssignCategory: (
    listIds: string[],
    category: {
      label: string
      value: string
      icon?: string
      color?: string
    },
  ) => Promise<void>
  editCategory: (
    categoryValue: string,
    updatedCategory: {
      label: string
      value: string
      icon?: string
      color?: string
    },
  ) => Promise<void>
}

const useUpdateList = ({ setRowSelection, onUpdateList, projectName }: UseUpdateListProps) => {
  const { listsData, categoryAttribute, categories } = useListsDataContext()
  const [renamingList, setRenamingList] = useState<UseUpdateListReturn['renamingList']>(null)
  const user = useAppSelector((state) => state.user)
  const isUser = !user.data?.isAdmin && !user.data?.isManager

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
          // Check if user has permission to rename categories
          if (isUser) {
            toast.error('You do not have permission to rename categories')
            return Promise.reject(new Error('Insufficient permissions'))
          }

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
    [renamingList, onUpdateList, closeRenameList, categoryAttribute, updateAttribute, isUser],
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
                [LIST_CATEGORY_ATTRIBUTE]: category,
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
    async (
      listIds: string[],
      category: {
        label: string
        value: string
        icon?: string
        color?: string
      },
    ) => {
      // update the attribute config to add the new category

      // Check if category already exists
      const categoryExists = categories?.some((item) => item.value == category.value)
      if (categoryExists) {
        const errorMsg = `Category "${category.label}" already exists`
        console.error(errorMsg)
        toast.error(errorMsg)
        return
      }

      // Create new enum item with all properties
      const newEnumItem: any = {
        label: category.label,
        value: category.value,
      }

      // Add optional properties if they exist
      if (category.icon) {
        newEnumItem.icon = category.icon
      }
      if (category.color) {
        newEnumItem.color = category.color
      }

      const newEnum = [...categories, newEnumItem]

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
        await setListsCategory(listIds, category.value)

        toast.success(
          `Category "${category.label}" created and assigned to ${listIds.length} list(s)`,
        )
      } catch (error: any) {
        console.error('Failed to create and assign category:', error)
        toast.error(`Failed to create and assign category: ${error.data?.detail || error.message}`)
        throw error
      }
    },
    [categories, setListsCategory, updateAttribute],
  )

  const editCategory = useCallback(
    async (
      originalCategoryValue: string,
      updatedCategory: {
        label: string
        value: string
        icon?: string
        color?: string
      },
    ) => {
      try {
        // Find the existing category
        const existingCategory = categories?.find((item) => item.value === originalCategoryValue)
        if (!existingCategory) {
          throw new Error('Category not found')
        }

        // Check if the new value conflicts with existing categories (if value is changing)
        if (originalCategoryValue !== updatedCategory.value) {
          const valueConflicts = categories?.some((item) => item.value === updatedCategory.value)
          if (valueConflicts) {
            const errorMsg = `Category value "${updatedCategory.value}" already exists`
            toast.error(errorMsg)
            throw new Error(errorMsg)
          }
        }

        // Update the enum array
        const newEnum = categories?.map((item) => {
          if (item.value === originalCategoryValue) {
            const updatedItem: any = {
              label: updatedCategory.label,
              value: updatedCategory.value,
            }
            if (updatedCategory.icon) {
              updatedItem.icon = updatedCategory.icon
            }
            if (updatedCategory.color) {
              updatedItem.color = updatedCategory.color
            }
            return updatedItem
          }
          return item
        })

        if (!newEnum) {
          throw new Error('Failed to generate updated enum for categories')
        }

        await updateAttribute({
          attributeName: LIST_CATEGORY_ATTRIBUTE,
          attributePatchModel: {
            data: {
              enum: newEnum,
            },
          },
        }).unwrap()

        // If the value changed, we need to update all lists that had the old category value
        if (originalCategoryValue !== updatedCategory.value) {
          // Find all lists with the old category value and update them
          const listsToUpdate = listsData
            .filter((list) => list.data?.category === originalCategoryValue)
            .map((list) => list.id)

          if (listsToUpdate.length > 0) {
            await setListsCategory(listsToUpdate, updatedCategory.value)
          }
        }

        toast.success(`Category "${updatedCategory.label}" updated successfully`)
      } catch (error: any) {
        console.error('Failed to update category:', error)
        toast.error(`Failed to update category: ${error.data?.detail || error.message}`)
        throw error
      }
    },
    [categories, updateAttribute, listsData, setListsCategory],
  )

  return {
    renamingList,
    openRenameList,
    closeRenameList,
    submitRenameList,
    setListsCategory,
    createAndAssignCategory,
    editCategory,
  }
}

export default useUpdateList
