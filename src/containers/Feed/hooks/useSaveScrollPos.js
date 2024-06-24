import { useEffect, useRef } from 'react'

const getCacheKey = (entities, filter) =>
  JSON.stringify({ entities: entities.map((e) => e.id), filter })

const useSaveScrollPos = ({ entities = [], feedRef, filter, disabled }) => {
  const scrollPositions = useRef({})

  // scroll to the bottom or saved position every time entityIds changes
  useEffect(() => {
    const cacheKey = getCacheKey(entities, filter)
    if (!feedRef.current || disabled) return
    // get saved scroll position or scroll to the bottom
    feedRef.current.scrollTop = scrollPositions.current[cacheKey] || 0
  }, [entities, filter, feedRef.current])

  useEffect(() => {
    let timeoutId = null

    if (!feedRef.current || disabled) return

    // Wrap the event listener function in a throttled function
    const throttledHandleScrollEvent = (e) => {
      if (timeoutId) {
        return
      }
      timeoutId = setTimeout(() => {
        timeoutId = null
      }, 300)

      const { scrollTop } = e.target

      // save scroll position
      const cacheKey = getCacheKey(entities, filter)
      scrollPositions.current[cacheKey] = scrollTop
    }

    // Assign the throttled function as the scroll event listener
    feedRef.current?.addEventListener('scroll', throttledHandleScrollEvent)

    return () => {
      // remove scroll event listener
      feedRef.current?.removeEventListener('scroll', throttledHandleScrollEvent)
    }
  }, [feedRef.current, filter, entities, disabled])
}

export default useSaveScrollPos
