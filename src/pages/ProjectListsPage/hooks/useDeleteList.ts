import { confirmDelete } from '@shared/util'
import { toast } from 'react-toastify'

interface UseDeleteListProps {
  onDeleteList: (listId: string) => Promise<void>
}

export interface UseDeleteListReturn {
  deleteList: (lists: { id: string; label: string }[]) => Promise<void>
}

const useDeleteList = ({ onDeleteList }: UseDeleteListProps): UseDeleteListReturn => {
  const deleteList: UseDeleteListReturn['deleteList'] = async (lists) => {
    try {
      if (lists.length === 1) {
        // Single list deletion
        const { id, label } = lists[0]
        confirmDelete({
          label: `list "${label}"`,
          message: 'The contents are not deleted, only the list itself.',
          accept: async () => {
            await onDeleteList(id)
          },
        })
      } else {
        // Multiple lists deletion
        confirmDelete({
          label: `${lists.length} selected lists`,
          message: 'The contents are not deleted, only the lists themselves.',
          accept: async () => {
            // Process deletions concurrently with Promise.all
            await Promise.all(lists.map(({ id }) => onDeleteList(id)))
          },
        })
      }
    } catch (error: any) {
      toast.error(`Failed to delete list: ${error.data?.detail}`)
      throw error
    }
  }

  return { deleteList }
}

export default useDeleteList
