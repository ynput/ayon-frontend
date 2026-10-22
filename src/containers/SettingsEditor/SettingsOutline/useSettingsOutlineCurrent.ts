import { RefObject, useCallback, useEffect, useState } from 'react'
import { SettingsOutlineItem, findSettingsGroup, getScrollParent } from './SettingsOutlineHelpers'

// The browser tracks which outline link's group is in view (scroll-target-group), and
// styles that link with :target-current
const NATIVE_SCROLLSPY = typeof CSS !== 'undefined' && CSS.supports('scroll-target-group: auto')

// Input that scrolls the sheet by hand; a jump from the outline scrolls without any
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const

/**
 * The group being read: the outline marks its link with aria-current, and highlights it
 * itself where the browser doesn't. Natively, the link is read back when scrolling ends;
 * elsewhere it's the deepest group crossing the middle of the view.
 * A clicked link stays current (`pinnedId`) until the sheet is scrolled by hand: a short
 * group, or one near the end of the sheet, never reaches the spot that makes it current.
 */
export const useSettingsOutlineCurrent = (
  sheetRef: RefObject<HTMLElement>,
  navRef: RefObject<HTMLElement>,
  items: SettingsOutlineItem[],
) => {
  const [trackedId, setTrackedId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const pin = useCallback((id: string) => setPinnedId(id), [])

  // any scrolling by hand gives the highlight back to the scroll position
  const pinned = !!pinnedId
  useEffect(() => {
    const scroller = getScrollParent(sheetRef.current)
    const target: HTMLElement | Window = scroller ?? window
    if (!pinned) return
    const unpin = () => setPinnedId(null)
    USER_SCROLL_EVENTS.forEach((type) => target.addEventListener(type, unpin, { passive: true }))
    return () => USER_SCROLL_EVENTS.forEach((type) => target.removeEventListener(type, unpin))
  }, [pinned, sheetRef])

  useEffect(() => {
    const sheet = sheetRef.current
    const nav = navRef.current
    if (!sheet || !nav || !items.length) return
    const scroller = getScrollParent(sheet)

    if (NATIVE_SCROLLSPY) {
      const scrollTarget: HTMLElement | Window = scroller ?? window
      const sync = () => {
        const link = nav.querySelector<HTMLElement>('a:target-current')
        setTrackedId(link?.dataset.outlineId ?? null)
      }
      // the browser updates the current link over the next rendering steps (it lags a
      // single frame), so read it two frames later
      let frame = 0
      const syncSoon = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(sync)
        })
      }
      syncSoon()
      scrollTarget.addEventListener('scrollend', syncSoon)
      // cards rendering after a long jump (content-visibility) move the groups without
      // scrolling; the sheet's height changes when they do
      const resizes = new ResizeObserver(syncSoon)
      resizes.observe(sheet)
      return () => {
        cancelAnimationFrame(frame)
        scrollTarget.removeEventListener('scrollend', syncSoon)
        resizes.disconnect()
      }
    }

    const crossing = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.fieldid
          if (!id) continue
          if (entry.isIntersecting) crossing.add(id)
          else crossing.delete(id)
        }
        // a sub-group comes after its card in the outline, so the last match is the deepest
        const current = [...items].reverse().find((item) => crossing.has(item.id))
        setTrackedId(current?.id ?? null)
      },
      { root: scroller, rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )
    items.forEach((item) => {
      const group = findSettingsGroup(sheet, item.id)
      if (group) observer.observe(group)
    })
    return () => observer.disconnect()
  }, [sheetRef, navRef, items])

  return { currentId: pinnedId ?? trackedId, pinned, pin, native: NATIVE_SCROLLSPY }
}
