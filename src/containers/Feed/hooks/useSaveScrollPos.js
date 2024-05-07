import { useEffect, useRef } from 'react'
const useSaveScrollPos = ({ entities = [], feedRef }) => {
  const scrollPositions = useRef({})

  // scroll to the bottom or saved position every time entityIds changes
  useEffect(() => {
    const cacheKey = JSON.stringify(entities.map((e) => e.id))
    if (!feedRef.current) return
    // get saved scroll position or scroll to the bottom
    feedRef.current.scrollTop = scrollPositions.current[cacheKey] || feedRef.current.scrollHeight
  }, [entities, feedRef.current])

  useEffect(() => {
    let timeoutId = null

    if (!feedRef.current) return

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
      const cacheKey = JSON.stringify(entities.map((e) => e.id))
      scrollPositions.current[cacheKey] = scrollTop
    }

    // Assign the throttled function as the scroll event listener
    feedRef.current?.addEventListener('scroll', throttledHandleScrollEvent)

    return () => {
      // remove scroll event listener
      feedRef.current?.removeEventListener('scroll', throttledHandleScrollEvent)
    }
  }, [feedRef.current, entities])
}

export default useSaveScrollPos
