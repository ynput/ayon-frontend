import { useEffect } from 'react'

const useScrollToHighlighted = ({ feedRef, highlighted = [], isLoading }) => {
  useEffect(() => {
    if (!highlighted.length || !feedRef.current || isLoading) return

    // find the first li element with classes containing isHighlighted
    const highlightedElement = feedRef.current.querySelector('li.isHighlighted')
    if (!highlightedElement) return console.error('no highlighted element found')

    // get the coordinates of the highlighted element
    const top = highlightedElement.offsetTop
    const height = highlightedElement.offsetHeight
    const feedHeight = feedRef.current.offsetHeight
    const padding = 64

    const commentTallerThanFeed = height + padding > feedHeight

    const scrollTop = commentTallerThanFeed ? top - 16 : top + height - feedHeight + padding

    console.log('scrolling to highlighted...')

    // scroll to the highlighted element
    feedRef.current.scrollTo({ top: scrollTop })
  }, [feedRef, highlighted, isLoading])
}

export default useScrollToHighlighted
