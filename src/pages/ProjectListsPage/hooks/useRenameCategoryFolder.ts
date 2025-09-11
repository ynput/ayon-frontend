import { useCallback } from 'react'
import { useUpdateEntityListMutation } from '@shared/api'
import { toast } from 'react-toastify'
import { EntityList } from '@shared/api'

interface UseRenameCategoryFolderProps {
  projectName: string
  listsData: EntityList[]
}

export const useRenameCategoryFolder = ({
  projectName,
  listsData,
}: UseRenameCategoryFolderProps) => {
  const [updateList] = useUpdateEntityListMutation()

  const renameCategoryFolder = useCallback(
    async (oldCategoryName: string, newCategoryName: string) => {
      try {
        // Find all lists that have the old category
        const listsToUpdate = listsData.filter((list) => list.data?.category === oldCategoryName)

        if (listsToUpdate.length === 0) {
          toast.error(`No lists found with category "${oldCategoryName}"`)
          return
        }

        // Update all lists with the new category name
        const updatePromises = listsToUpdate.map((list) =>
          updateList({
            listId: list.id,
            projectName,
            entityListPatchModel: {
              data: {
                ...list.data,
                category: newCategoryName,
              },
            },
          }).unwrap(),
        )

        await Promise.all(updatePromises)

        toast.success(
          `Renamed category "${oldCategoryName}" to "${newCategoryName}" for ${
            listsToUpdate.length
          } list${listsToUpdate.length === 1 ? '' : 's'}`,
        )
      } catch (error: any) {
        console.error('Failed to rename category:', error)
        toast.error(`Failed to rename category: ${error.data?.detail || error.message}`)
        throw error // Re-throw to handle in calling component
      }
    },
    [updateList, projectName, listsData],
  )

  return { renameCategoryFolder }
}

export default useRenameCategoryFolder
