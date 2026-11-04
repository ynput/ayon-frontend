import { RefObject, useCallback, useLayoutEffect, useState } from 'react'

export interface HorizontalOverflow {
  overflowing: boolean
  canScrollStart: boolean
  canScrollEnd: boolean
}

const NO_OVERFLOW: HorizontalOverflow = {
  overflowing: false,
  canScrollStart: false,
  canScrollEnd: false,
}

const measure = (el: HTMLElement): HorizontalOverflow => {
  const maxScroll = el.scrollWidth - el.clientWidth
  // compare against the parent: scroll buttons shrink the list itself
  const available = el.parentElement?.clientWidth ?? el.clientWidth
  // 1px tolerance for fractional widths
  return {
    overflowing: el.scrollWidth - available > 1,
    canScrollStart: el.scrollLeft > 1,
    canScrollEnd: el.scrollLeft < maxScroll - 1,
  }
}

const isSame = (a: HorizontalOverflow, b: HorizontalOverflow) =>
  a.overflowing === b.overflowing &&
  a.canScrollStart === b.canScrollStart &&
  a.canScrollEnd === b.canScrollEnd

export const useHorizontalOverflow = (ref: RefObject<HTMLElement | null>) => {
  const [overflow, setOverflow] = useState<HorizontalOverflow>(NO_OVERFLOW)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const next = measure(el)
      setOverflow((prev) => (isSame(prev, next) ? prev : next))
    }

    update()
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)
    if (el.parentElement) resizeObserver.observe(el.parentElement)
    // tabs or their text (e.g. unread counts) can change scrollWidth without resizing the list
    const mutationObserver = new MutationObserver(update)
    mutationObserver.observe(el, { childList: true, characterData: true, subtree: true })
    el.addEventListener('scroll', update, { passive: true })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      el.removeEventListener('scroll', update)
    }
  }, [ref])

  const scrollByPage = useCallback(
    (direction: 1 | -1) => {
      const el = ref.current
      if (!el) return
      el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
    },
    [ref],
  )

  return { ...overflow, scrollByPage }
}
