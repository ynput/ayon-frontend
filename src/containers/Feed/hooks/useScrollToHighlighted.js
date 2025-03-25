import { useEffect, useRef } from 'react'

const useScrollToHighlighted = ({ feedRef, highlighted = [], isLoading, loadMore, pageInfo }) => {
  const scrollComplete = useRef([])

  const getHighlightedElement = async (newPageInfo, reloadCount = 0) => {
    // find the first li element with classes containing isHighlighted
    const foundEl = feedRef.current.querySelector('li.isHighlighted')

    if (foundEl) return foundEl

    reloadCount++

    // there are no more items to load
    if (!newPageInfo.hasPreviousPage) return null

    // if we've reloaded more than 10 times give up
    // prevents infinite loop
    if (reloadCount > 10) return null

    // if no highlighted element is found, load more items
    const pageInfo = await loadMore(newPageInfo)

    // check again for the highlighted element
    return getHighlightedElement(pageInfo, reloadCount)
  }

  const highlightItems = async () => {
    // set the scroll complete flag so we don't scroll again
    // even if some other dependency changes
    const highlightedElement = await getHighlightedElement(pageInfo)

    scrollComplete.current = highlighted

    if (!highlightedElement) {
      console.error('No highlighted element found')

      return
    }

    // get the coordinates of the highlighted element
    const top = highlightedElement.offsetTop
    const height = highlightedElement.offsetHeight
    const feedHeight = feedRef.current?.offsetHeight
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
  }, [feedRef, highlighted, isLoading, loadMore, scrollComplete, pageInfo])
}

export default useScrollToHighlighted
