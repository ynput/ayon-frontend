import { useEffect, useRef, RefObject } from 'react'

interface UseScrollToHighlightedProps {
  feedRef: RefObject<HTMLElement>
  highlighted?: string[]
  isLoading: boolean
  loadNextPage: () => Promise<any>
  hasNextPage: boolean
}

const useScrollToHighlighted = ({
  feedRef,
  highlighted = [],
  isLoading,
  loadNextPage,
  hasNextPage,
}: UseScrollToHighlightedProps): void => {
  const scrollComplete = useRef<string[]>([])

  const getHighlightedElement = async (reloadCount = 0): Promise<HTMLElement | null> => {
    // find the first li element with classes containing isHighlighted
    const foundEl = feedRef.current?.querySelector('li.isHighlighted') as HTMLElement | null

    if (foundEl) return foundEl

    reloadCount++

    // if we've reloaded more than 10 times give up
    // prevents infinite loop
    if (reloadCount > 10) return null

    // if no highlighted element is found, load more items
    const result = await loadNextPage()
    if (!result) return null
    const hasNextPage = result.hasNextPage
    if (!hasNextPage) return null

    // check again for the highlighted element
    return getHighlightedElement(reloadCount)
  }

  const highlightItems = async (): Promise<void> => {
    if (!hasNextPage) return
    // set the scroll complete flag so we don't scroll again
    // even if some other dependency changes
    const highlightedElement = await getHighlightedElement()

    scrollComplete.current = highlighted

    if (!highlightedElement) {
      console.error('No highlighted element found')

      return
    }

    // get the coordinates of the highlighted element
    const top = highlightedElement.offsetTop
    const height = highlightedElement.offsetHeight
    const feedHeight = feedRef.current?.offsetHeight || 0
    const padding = 64

    const commentTallerThanFeed = height + padding > feedHeight

    const scrollTop = commentTallerThanFeed ? top - 16 : top + height - feedHeight + padding

    console.log('FOUND: scrolling to highlighted...')

    // scroll to the highlighted element
    feedRef.current?.scrollTo({ top: scrollTop })
  }

  useEffect(() => {
    if (!highlighted.length || !feedRef.current || isLoading) return

    // if highlighted is the same as scrollComplete array, don't scroll
    if (highlighted.every((id) => scrollComplete.current?.includes(id))) return

    console.log('trying to scroll to highlighted...')
    highlightItems()
  }, [feedRef, highlighted, isLoading, loadNextPage, scrollComplete, hasNextPage])
}

export default useScrollToHighlighted
