import { useEffect, useState } from 'react'

const useInboxRefresh = ({ isFetching, refetch }) => {
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
  }

  return [handleRefresh, { isRefreshing }]
}

export default useInboxRefresh
