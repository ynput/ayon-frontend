import { useCallback } from 'react'
import { EntityListItem, useUpdateEntityListItemsMutation } from '@shared/api'
import { Active, Over } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { toast } from 'react-toastify'

type UseReorderListItemProps = {
  projectName: string
  listId?: string
  listItems: EntityListItem[]
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
}: UseReorderListItemProps): UseReorderListItemReturn => {
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  const reorderListItem = useCallback<ReorderListItem>(
    async (active, over) => {
      const oldIndex = listItems.findIndex((row) => row.id === active.id)
      const newIndex = listItems.findIndex((row) => row.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const shuffledArray = arrayMove(listItems, oldIndex, newIndex)
        // update the position for each item to match new index
        const newItemPositions = shuffledArray.map((item, index) => ({
          id: item.id,
          position: index,
        }))

        try {
          if (!listId) {
            throw { data: { detail: 'No listId provided' } }
          }

          await updateEntityListItems({
            projectName,
            listId: listId,
            entityListMultiPatchModel: {
              items: newItemPositions,
              mode: 'merge',
            },
          }).unwrap()
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
