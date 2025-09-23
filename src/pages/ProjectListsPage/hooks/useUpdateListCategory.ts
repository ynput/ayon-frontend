import { useCallback } from 'react'
import { usePatchAttributeConfigMutation, useUpdateEntityListMutation } from '@shared/api'
import { toast } from 'react-toastify'
import { LIST_CATEGORY_ATTRIBUTE, useListsDataContext } from '../context/ListsDataContext'
import { kebabCase } from 'lodash'

interface UseUpdateListCategoryProps {
  projectName: string
}

export const useUpdateListCategory = ({ projectName }: UseUpdateListCategoryProps) => {
  const { categories } = useListsDataContext()
  const [updateList] = useUpdateEntityListMutation()
  const [updateAttribute] = usePatchAttributeConfigMutation()

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
    [setListsCategory],
  )

  return {
    setListsCategory,
    createAndAssignCategory,
  }
}

export default useUpdateListCategory
