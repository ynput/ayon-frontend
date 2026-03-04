import { useEffect, useRef, RefObject } from 'react'

interface UseScrollToHighlightedProps {
  feedRef: RefObject<HTMLElement>
  highlighted?: string[]
  isLoading: boolean
  loadNextPage?: () => Promise<any>
  hasNextPage: boolean
  activities: any[]
}

const useScrollToHighlighted = ({
  feedRef,
  highlighted = [],
  isLoading,
  loadNextPage,
  hasNextPage,
  activities,
}: UseScrollToHighlightedProps): void => {
  const scrollComplete = useRef<string[]>([])

  const getHighlightedElement = async (
    feedEl: HTMLElement,
    reloadCount = 0,
  ): Promise<HTMLElement | null> => {
    if (!loadNextPage) return null

    // find the first li element with classes containing isHighlighted
    const foundEl = feedEl.querySelector('li.isHighlighted') as HTMLElement | null

    if (foundEl) return foundEl

    reloadCount++

    // if we've reloaded more than 10 times give up
    // prevents infinite loop
    if (reloadCount > 10) return null

    // if no highlighted element is found, load more items
    const result = await loadNextPage()
    if (!result) return null
    const more = result.hasNextPage
    if (!more) return null

    // wait a frame to allow DOM to update after new items load
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    // check again for the highlighted element
    return getHighlightedElement(feedEl, reloadCount)
  }

  const highlightItems = async (feedEl: HTMLElement): Promise<void> => {
    // set the scroll complete flag so we don't scroll again
    // even if some other dependency changes
    const highlightedElement = await getHighlightedElement(feedEl)

    if (!highlightedElement) {
      console.error('No highlighted element found')

      return
    }

    // get the coordinates of the highlighted element
    const top = highlightedElement.offsetTop
    const height = highlightedElement.offsetHeight
    const feedHeight = feedEl.offsetHeight || 0
    const padding = 64

    const commentTallerThanFeed = height + padding > feedHeight

    const scrollTop = commentTallerThanFeed ? top - 16 : top + height - feedHeight + padding

    console.log('FOUND: scrolling to highlighted...')

    // scroll to the highlighted element
    feedEl.scrollTo({ top: scrollTop })

    // mark scroll as complete only after successful scroll
    scrollComplete.current = highlighted
  }

  useEffect(() => {
    if (!highlighted.length || !feedRef.current || isLoading || !loadNextPage) return

    // if highlighted is the same as scrollComplete array, don't scroll
    if (highlighted.every((id) => scrollComplete.current?.includes(id))) return

    console.log('trying to scroll to highlighted...')
    highlightItems(feedRef.current)
  }, [feedRef, highlighted, activities, isLoading, loadNextPage, scrollComplete, hasNextPage])
}

export default useScrollToHighlighted
