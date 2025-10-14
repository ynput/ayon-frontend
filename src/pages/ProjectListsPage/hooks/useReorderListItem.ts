import { useCallback } from 'react'
import { EntityListItem, useUpdateEntityListItemsMutation } from '@shared/api'
import { Active, Over } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'react-toastify'
import { isEntityRestricted } from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'

type UseReorderListItemProps = {
  projectName: string
  listId?: string
  listItems: EntityListItem[]
  onReorderFinished?: () => void
}

export type ListItem = { id: string; entityId: string }

type ReorderListItem = (active: Active, over: Over) => Promise<void>

export type UseReorderListItemReturn = {
  reorderListItem: ReorderListItem
}

const useReorderListItem = ({
  projectName,
  listId,
  listItems,
  onReorderFinished,
}: UseReorderListItemProps): UseReorderListItemReturn => {
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  const reorderListItem = useCallback<ReorderListItem>(
    async (active, over) => {
      const oldIndex = listItems.findIndex((row) => row.id === active.id)
      const newIndex = listItems.findIndex((row) => row.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const shuffledArray = arrayMove(listItems, oldIndex, newIndex)

        // Only send position updates for non-restricted entities to avoid invalid entity ID errors
        // Restricted entities have placeholder IDs that don't exist in the database
        const newItemPositions = shuffledArray
          .map((item, index) => {
            // Skip restricted entities - they can't be updated on the backend
            if (isEntityRestricted(item.entityType)) {
              return null
            }
            return {
              id: item.id,
              position: index,
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)

        try {
          if (!listId) {
            throw { data: { detail: 'No listId provided' } }
          }

          // Only send the update if there are non-restricted items to update
          if (newItemPositions.length > 0) {
            await updateEntityListItems({
              projectName,
              listId: listId,
              entityListMultiPatchModel: {
                items: newItemPositions,
                mode: 'merge',
                // @ts-ignore - Add custom property for optimistic update to use
                __clientSidePositions: shuffledArray.map((item, index) => ({
                  id: item.id,
                  position: index,
                })),
              },
            }).unwrap()
          }

          // any extra callbacks after the reorder
          onReorderFinished?.()
        } catch (error: any) {
          console.error('Error sorting: ', error)
          toast.error('Error sorting: ' + error.data.detail)
        }
      }
    },
    [projectName, listId, listItems],
  )

  return {
    reorderListItem,
  }
}

export default useReorderListItem
