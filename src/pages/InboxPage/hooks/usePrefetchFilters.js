import { useEffect } from 'react'
import { useLazyGetInboxQuery } from '/src/services/inbox/getInbox'

const usePrefetchFilters = ({ filter, filters = {}, last }) => {
  const [getInbox] = useLazyGetInboxQuery()
  // for each filter that is not the current filter, prefetch the data
  useEffect(() => {
    Object.keys(filters).forEach((f) => {
      if (f !== filter) {
        const filterArgs = filters[f] || {}
        getInbox({
          last: last,
          active: filterArgs.active,
          important: filterArgs.important,
        })
      }
    })
  }, [])
}

export default usePrefetchFilters
