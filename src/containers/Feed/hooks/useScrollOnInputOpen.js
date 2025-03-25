import { useEffect } from 'react'

const useScrollOnInputOpen = ({ feedRef, isInputOpen, height }) => {
  // scroll by height of comment input when it opens or closes
  // for now use hard coded value
  useEffect(() => {
    if (!feedRef.current) return
    const heightDiff = height

    const isAtBottom = feedRef.current.scrollTop === 0

    if (!isAtBottom) {
      if (isInputOpen) feedRef.current.scrollBy(0, heightDiff)
      else feedRef.current.scrollBy(0, -heightDiff)
    }
  }, [isInputOpen, feedRef.current])
}

export default useScrollOnInputOpen
