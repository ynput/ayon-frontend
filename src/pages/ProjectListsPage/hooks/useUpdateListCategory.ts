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

  return { updateCategory, createAndAssignCategory }
}

export default useUpdateListCategory
