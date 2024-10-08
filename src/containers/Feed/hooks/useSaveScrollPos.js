import { useEffect, useRef } from 'react'

const getCacheKey = (entities, filter) =>
  JSON.stringify({ entities: entities.map((e) => e.id), filter })

const useSaveScrollPos = ({ entities = [], feedRef, filter, disabled, isLoading }) => {
  const scrollPositions = useRef({})

  // finds all elements with the class 'scroll-to'
  // get scroll top value
  const getScrollToItem = (feedRef) => {
    const elements = feedRef.current.querySelectorAll('.scroll-to')
    // get parent li element with class of comment
    const parents = Array.from(elements).map((el) => el.closest('li.comment'))
    // filter out duplicate parents by id, keep element
    const lastParent = parents[parents.length - 1]

    // get top value
    return lastParent?.offsetTop - 8 || 0
  }

  // scroll to the bottom or saved position every time entityIds changes
  useEffect(() => {
    const cacheKey = getCacheKey(entities, filter)
    if (!feedRef.current || disabled || isLoading) return
    // get saved scroll position or scroll to the bottom
    feedRef.current.scrollTop = scrollPositions.current[cacheKey] || getScrollToItem(feedRef)
  }, [entities, filter, feedRef.current, isLoading])

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
