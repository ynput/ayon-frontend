import { MouseEvent, RefObject, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import debounce from 'lodash/debounce'
import {
  SettingsOutlineItem,
  findSettingsGroup,
  getScrollContainer,
  isSameOutline,
  readSettingsOutline,
  scrollToSettingsGroup,
} from './SettingsOutlineHelpers'
import { useSettingsOutlineCurrent } from './useSettingsOutlineCurrent'
import { useSettingsOutlineCollapsed } from './useSettingsOutlineCollapsed'
import { announceOutline } from './outlineAvailability'
import * as Styled from './SettingsOutline.styled'

export type SettingsOutlineProps = {
  /** The element the settings form renders into, or one holding several forms */
  sheetRef: RefObject<HTMLElement>
}

// Re-reading the sheet waits for a burst of DOM changes (typing, a search) to settle
const UPDATE_DELAY = 150

// by item depth: a sheet, a card, a sub-group
const OUTLINE_LINK_CLASSES = [
  'settings-outline-sheet',
  'settings-outline-card',
  'settings-outline-subgroup',
]

/**
 * The flat layout's table of contents: every card and the sub-groups inside it,
 * each a link that scrolls its group into view. The link of the group being read is
 * highlighted as the sheet scrolls. Given several sheets, each one heads its cards.
 */
export const SettingsOutline = ({ sheetRef }: SettingsOutlineProps) => {
  const [items, setItems] = useState<SettingsOutlineItem[]>([])
  const navRef = useRef<HTMLElement>(null)
  // hidden with the toolbar button (SettingsOutlineToggle)
  const [collapsed] = useSettingsOutlineCollapsed()
  const { currentId, pinned, pin, native } = useSettingsOutlineCurrent(sheetRef, navRef, items)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return

    const update = debounce(() => {
      const next = readSettingsOutline(sheet)
      setItems((prev) => (isSameOutline(prev, next) ? prev : next))
    }, UPDATE_DELAY)

    update()
    // groups come and go with list edits and search, and list items rename their group
    const observer = new MutationObserver(update)
    observer.observe(sheet, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-hidden'],
    })

    return () => {
      observer.disconnect()
      update.cancel()
    }
  }, [sheetRef])

  // the rail scrolls on its own, so it keeps the current link in view: over several addons
  // it is many times taller than the view. Only the rail scrolls, never the sheet
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !currentId) return
    const link = nav.querySelector<HTMLElement>(`[data-outline-id="${CSS.escape(currentId)}"]`)
    if (!link) return
    const navBox = nav.getBoundingClientRect()
    const linkBox = link.getBoundingClientRect()
    if (linkBox.top >= navBox.top && linkBox.bottom <= navBox.bottom) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    nav.scrollBy({
      top: linkBox.top - navBox.top - navBox.height / 3,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [currentId])

  const onNavigate = (e: MouseEvent, id: string) => {
    e.preventDefault()
    const sheet = sheetRef.current
    const group = sheet && findSettingsGroup(sheet, id)
    if (!sheet || !group) return
    scrollToSettingsGroup(sheet, group)
    pin(id)
  }

  // a single group needs no outline: the toolbar's toggle waits for one with links
  const hasLinks = items.length >= 2
  useEffect(() => (hasLinks ? announceOutline() : undefined), [hasLinks])

  // the rail sticks to the top of the panel it scrolls in, so it is as tall as that panel
  useEffect(() => {
    const nav = navRef.current
    const scroller = getScrollContainer(nav?.parentElement ?? null)
    if (!nav || !scroller) return
    const observer = new ResizeObserver(() =>
      nav.style.setProperty('--settings-outline-height', `${scroller.clientHeight}px`),
    )
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [hasLinks])

  if (!hasLinks) return null

  return (
    <Styled.Outline
      ref={navRef}
      className={clsx('settings-outline', pinned && 'is-pinned', collapsed && 'is-collapsed')}
      aria-label="Settings outline"
    >
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Styled.Link
              href={`#${item.id}`}
              className={clsx(
                OUTLINE_LINK_CLASSES[item.depth] ?? 'settings-outline-subgroup',
                (!native || pinned) && item.id === currentId && 'is-current',
              )}
              data-outline-id={item.id}
              aria-current={item.id === currentId ? 'true' : undefined}
              title={item.title}
              onClick={(e) => onNavigate(e, item.id)}
            >
              {item.title}
            </Styled.Link>
          </li>
        ))}
      </ul>
    </Styled.Outline>
  )
}
