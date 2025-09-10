import { useCallback } from 'react'
import { useUpdateEntityListMutation } from '@shared/api'
import { toast } from 'react-toastify'

interface UseUpdateListCategoryProps {
  projectName: string
}

export const useUpdateListCategory = ({ projectName }: UseUpdateListCategoryProps) => {
  const [updateList] = useUpdateEntityListMutation()

  const updateCategory = useCallback(
    async (listId: string, category: string | null) => {
      try {
        await updateList({
          listId,
          projectName,
          entityListPatchModel: {
            data: {
              category,
            },
          },
        })

        const message = category ? `Category set to "${category}"` : 'Category removed'
        toast.success(message)
      } catch (error: any) {
        console.error('Failed to update category:', error)
        toast.error(`Failed to update category: ${error.data?.detail || error.message}`)
      }
    },
    [updateList, projectName],
  )

  const createAndAssignCategory = useCallback(
    async (listId: string, categoryName: string) => {
      try {
        await updateList({
          listId,
          projectName,
          entityListPatchModel: {
            data: {
              category: categoryName,
            },
          },
        })

        toast.success(`Created and assigned category "${categoryName}"`)
      } catch (error: any) {
        console.error('Failed to create and assign category:', error)
        toast.error(`Failed to create category: ${error.data?.detail || error.message}`)
        throw error // Re-throw to handle in dialog
      }
    },
    [updateList, projectName],
  )

  const updateCategoryBulk = useCallback(
    async (listIds: string[], category: string | null) => {
      try {
        const updatePromises = listIds.map((listId) =>
          updateList({
            listId,
            projectName,
            entityListPatchModel: {
              data: {
                category,
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

  const createAndAssignCategoryBulk = useCallback(
    async (listIds: string[], categoryName: string) => {
      try {
        const updatePromises = listIds.map((listId) =>
          updateList({
            listId,
            projectName,
            entityListPatchModel: {
              data: {
                category: categoryName,
              },
            },
          }).unwrap(),
        )

        await Promise.all(updatePromises)

        toast.success(
          `Created and assigned category "${categoryName}" to ${listIds.length} list${
            listIds.length === 1 ? '' : 's'
          }`,
        )
      } catch (error: any) {
        console.error('Failed to create and assign category:', error)
        toast.error(`Failed to create category: ${error.data?.detail || error.message}`)
        throw error
      }
    },
    [updateList, projectName],
  )

  return {
    updateCategory,
    createAndAssignCategory,
    updateCategoryBulk,
    createAndAssignCategoryBulk,
  }
}

export default useUpdateListCategory
