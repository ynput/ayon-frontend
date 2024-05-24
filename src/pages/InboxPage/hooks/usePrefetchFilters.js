import { useEffect } from 'react'
import { useLazyGetInboxQuery } from '/src/services/inbox/getInbox'

const usePrefetchFilters = ({ filter, filters = {}, userName, isCleared, last }) => {
  const [getInbox] = useLazyGetInboxQuery()
  // for each filter that is not the current filter, prefetch the data
  useEffect(() => {
    Object.keys(filters).forEach((f) => {
      if (f !== filter) {
        const activityTypes = filters[f]
        getInbox({
          last: last,
          activityTypes: activityTypes,
          isCleared: isCleared,
          userName: userName,
        })
      }
    })
  }, [])
}

export default usePrefetchFilters
