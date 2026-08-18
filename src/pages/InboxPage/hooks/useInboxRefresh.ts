import { useEffect, useState } from 'react'
import api from '@shared/api'
import type { AppDispatch } from '@state/store'

interface UseInboxRefreshProps {
  isFetching: boolean
  isUninitialized?: boolean
  refetch: () => void
  dispatch: AppDispatch
}

interface UseInboxRefreshReturn {
  isRefreshing: boolean
}

const useInboxRefresh = ({
  isFetching,
  isUninitialized,
  refetch,
  dispatch,
}: UseInboxRefreshProps): [() => void, UseInboxRefreshReturn] => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  useEffect(() => {
    if (isRefreshing && !isFetching) {
      // add some fake delay to show the loading spinner
      setIsRefreshing(false)
    }
  }, [isFetching, isRefreshing])

  const handleRefresh = (): void => {
    setIsRefreshing(true)
    // refetch throws when the query was skipped
    if (!isUninitialized) refetch()
    // also invalidate the unread count
    dispatch(api.util.invalidateTags([{ type: 'inbox', id: 'unreadCount' }]))
  }

  return [handleRefresh, { isRefreshing }]
}

export default useInboxRefresh
