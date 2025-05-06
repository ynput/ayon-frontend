import { confirmDelete } from '@shared/util'
import { toast } from 'react-toastify'
import { useListsDataContext } from '../context/ListsDataContext'

interface UseDeleteListProps {
  onDeleteList: (listId: string) => Promise<void>
}

export interface UseDeleteListReturn {
  deleteLists: (lists: string[], config?: { force?: boolean }) => Promise<void>
}

const useDeleteList = ({ onDeleteList }: UseDeleteListProps): UseDeleteListReturn => {
  const { listsMap } = useListsDataContext()

  const deleteLists: UseDeleteListReturn['deleteLists'] = async (ids, config) => {
    const lists = ids.map((id) => listsMap.get(id)).filter((list) => list !== undefined)
    try {
      if (config?.force) {
        // Force delete all lists without confirmation
        await Promise.all(lists.map(({ id }) => onDeleteList(id)))
        toast.success('Deleted lists successfully')
      } else if (lists.length === 1) {
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

  return { deleteLists }
}

export default useDeleteList
