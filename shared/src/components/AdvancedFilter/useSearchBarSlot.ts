import { RefObject, useEffect, useState } from 'react'
import type { SearchFilterRef } from '@ynput/ayon-react-components'

// An element at the end of a search bar, after its chips and text, for content the page adds to
// the bar. It has no box of its own (display: contents), so its content sits in the bar's row;
// CSS `order` sorts what several of them hold.
export const useSearchBarSlot = (
  searchFilterRef: RefObject<SearchFilterRef>,
): HTMLElement | null => {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const bar = searchFilterRef.current?.getFiltersBarElement()
    if (!bar) return
    const element = document.createElement('span')
    element.className = 'search-bar-slot'
    element.style.display = 'contents'
    bar.appendChild(element)
    setSlot(element)
    return () => {
      element.remove()
      setSlot(null)
    }
  }, [searchFilterRef])

  return slot
}
