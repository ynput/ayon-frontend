import { useEffect, useState } from 'react'
import api from '@api'

const useInboxRefresh = ({ isFetching, refetch, dispatch }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  useEffect(() => {
    if (isRefreshing && !isFetching) {
      // add some fake delay to show the loading spinner
      setIsRefreshing(false)
    }
  }, [isFetching, isRefreshing])

  const handleRefresh = () => {
    console.log('refetching inbox...')
    setIsRefreshing(true)
    refetch()
    // also invalidate the unread count
    dispatch(api.util.invalidateTags([{ type: 'inbox', id: 'unreadCount' }]))
  }

  return [handleRefresh, { isRefreshing }]
}

export default useInboxRefresh
