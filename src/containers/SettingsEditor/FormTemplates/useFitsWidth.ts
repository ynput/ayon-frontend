import { RefObject, useLayoutEffect, useState } from 'react'

/**
 * Whether an element is at least `needed` px wide, kept up to date as it resizes. It only
 * changes (and re-renders) when the element crosses that width. Nothing is needed (0): it fits.
 * An element not laid out yet (a card skipped while off screen) keeps the last answer.
 */
export const useFitsWidth = (ref: RefObject<HTMLElement>, needed: number) => {
  const [fits, setFits] = useState(true)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || !needed) {
      setFits(true)
      return
    }
    const check = () => {
      if (element.clientWidth > 0) setFits(element.clientWidth >= needed)
    }
    check()
    const observer = new ResizeObserver(check)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, needed])

  return fits
}
