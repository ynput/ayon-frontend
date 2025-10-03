import { useLazyGetListItemsQuery, useUpdateEntityListItemsMutation } from '@shared/api'
import { toast } from 'react-toastify'

type Props = { projectName: string }

const useClearListItems = ({ projectName }: Props) => {
  const [getListItems] = useLazyGetListItemsQuery()
  const [updateEntityListItems] = useUpdateEntityListItemsMutation()

  const clearListItems = async (listId: string) => {
    // set up loading toast
    const toastId = toast.loading('Clearing list items...')
    try {
      // first get all items in the list (max 1000)
      const result = await getListItems({
        projectName,
        listId,
        first: 1000,
      }).unwrap()

      const hasNextPage = result.pageInfo.hasNextPage
      const items = result.items.map((item) => ({ id: item.id }))

      //   delete all the items from the list
      await updateEntityListItems({
        projectName,
        listId,
        entityListMultiPatchModel: {
          items,
          mode: 'delete',
        },
      }).unwrap()

      // when finished, update the toast
      toast.update(toastId, {
        render: `Cleared ${result.items.length} items from list`,
        type: 'success',
        isLoading: false,
        autoClose: 5000,
      })
      //   warning if there are more than 1000 items
      if (hasNextPage) {
        toast.warn('List has more than 1000 items, please clear them in batches of 1000')
      }
    } catch (error: any) {
      console.error('Error clearing list items:', error)
      // update toast with error
      toast.update(toastId, {
        render: `Error clearing list items: ${error}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      })
    }
  }

  return { clearListItems }
}

export default useClearListItems
