import { MouseEvent, RefObject, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import debounce from 'lodash/debounce'
import {
  SettingsOutlineItem,
  findSettingsGroup,
  isSameOutline,
  readSettingsOutline,
  scrollToSettingsGroup,
} from './SettingsOutlineHelpers'
import { getSettingsGroupAnchor } from '../SettingsGroup/SettingsGroupHelpers'
import { useSettingsOutlineCurrent } from './useSettingsOutlineCurrent'
import * as Styled from './SettingsOutline.styled'

export type SettingsOutlineProps = {
  /** The element the settings form renders into */
  sheetRef: RefObject<HTMLElement>
}

// Re-reading the sheet waits for a burst of DOM changes (typing, a search) to settle
const UPDATE_DELAY = 150

/**
 * The flat layout's table of contents: every card and the sub-groups inside it,
 * each a link that scrolls its group into view. The link of the group being read is
 * highlighted as the sheet scrolls.
 */
export const SettingsOutline = ({ sheetRef }: SettingsOutlineProps) => {
  const [items, setItems] = useState<SettingsOutlineItem[]>([])
  const navRef = useRef<HTMLElement>(null)
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

  const onNavigate = (e: MouseEvent, id: string) => {
    e.preventDefault()
    const sheet = sheetRef.current
    const group = sheet && findSettingsGroup(sheet, id)
    if (!sheet || !group) return
    scrollToSettingsGroup(sheet, group)
    pin(id)
  }

  if (items.length < 2) return null

  return (
    <Styled.Outline
      ref={navRef}
      className={clsx('settings-outline', pinned && 'is-pinned')}
      aria-label="Settings outline"
    >
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Styled.Link
              href={`#${getSettingsGroupAnchor(item.id)}`}
              className={clsx(
                item.depth === 1 ? 'settings-outline-card' : 'settings-outline-subgroup',
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
