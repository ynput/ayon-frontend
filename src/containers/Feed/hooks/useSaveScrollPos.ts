import { useEffect, useRef, RefObject } from 'react'

// Define types for entities and filter
interface Entity {
  id: string | number
}

interface ScrollPositionsRef {
  [key: string]: number
}

interface UseSaveScrollPosProps {
  entities?: Entity[]
  feedRef: RefObject<HTMLElement>
  filter: any // Replace with more specific type if filter structure is known
  disabled?: boolean
  isLoading?: boolean
}

const getCacheKey = (entities: Entity[], filter: any): string =>
  JSON.stringify({ entities: entities.map((e) => e.id), filter })

const useSaveScrollPos = ({
  entities = [],
  feedRef,
  filter,
  disabled,
  isLoading,
}: UseSaveScrollPosProps): void => {
  const scrollPositions = useRef<ScrollPositionsRef>({})

  // finds all elements with the class 'scroll-to'
  // get scroll top value
  const getScrollToItem = (feedRef: RefObject<HTMLElement>): number => {
    const elements = feedRef.current!.querySelectorAll('.scroll-to')
    // get parent li element with class of comment
    const parents = Array.from(elements).map((el) => el.closest('li.comment'))
    // filter out duplicate parents by id, keep element
    const lastParent = parents[parents.length - 1] as HTMLElement | undefined

    // get top value
    return (lastParent?.offsetTop || 0) - 8 || 0
  }

  // scroll to the bottom or saved position every time entityIds changes
  useEffect(() => {
    const cacheKey = getCacheKey(entities, filter)
    if (!feedRef.current || disabled || isLoading) return
    // get saved scroll position or scroll to the bottom
    feedRef.current.scrollTop = scrollPositions.current[cacheKey] || getScrollToItem(feedRef)
  }, [entities, filter, feedRef.current, isLoading])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (!feedRef.current || disabled) return

    // Wrap the event listener function in a throttled function
    const throttledHandleScrollEvent = (e: Event): void => {
      if (timeoutId) {
        return
      }
      timeoutId = setTimeout(() => {
        timeoutId = null
      }, 300)

      const { scrollTop } = e.target as HTMLElement

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
