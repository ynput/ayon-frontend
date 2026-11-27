import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import type { RailEntry } from './arrange'
import * as Styled from './NavRail.styled'

// a group opens a moment after the pointer reaches it, so passing over it on the way down doesn't
const OPEN_DELAY = 150
const CLOSE_DELAY = 120

interface RailFolderProps {
  entry: RailEntry & { folder: NonNullable<RailEntry['folder']> }
  /** the selected item, if it is in the group */
  activeId?: string
  /** a group's item, as the sidebar shows its items */
  renderItem: (item: NonNullable<RailEntry['item']>) => ReactNode
}

/**
 * A group of sidebar items (the arrangement's folder): its first items' icons in a square and its
 * name. Pointing at it, or tabbing to it, opens its items over the ones below (above, when the
 * sidebar ends first); nothing below moves. A click opens or closes it too (touch).
 */
const RailFolder = ({ entry, activeId, renderItem }: RailFolderProps) => {
  const { label, items } = entry.folder
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()
  const later = (next: boolean, delay: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(next), delay)
  }
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // below the tile when the sidebar has the room, else above it
  useLayoutEffect(() => {
    if (!open) return
    const wrap = wrapRef.current
    const panel = panelRef.current
    const rail = wrap?.closest('[data-nav-rail]')
    if (!wrap || !panel || !rail) return
    const room = rail.getBoundingClientRect().bottom - wrap.getBoundingClientRect().bottom
    setUp(panel.offsetHeight > room)
  }, [open])

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape' || !open) return
    e.stopPropagation()
    setOpen(false)
    wrapRef.current?.querySelector('button')?.focus()
  }

  const isActive = items.some((item) => item.id === activeId)
  return (
    <Styled.FolderWrap
      ref={wrapRef}
      onMouseEnter={() => later(true, OPEN_DELAY)}
      onMouseLeave={() => later(false, CLOSE_DELAY)}
      onFocus={() => later(true, 0)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <Styled.FolderTile
        type="button"
        className={clsx({ active: isActive, open })}
        aria-expanded={open}
        aria-label={label}
        data-rail-item={entry.id}
        data-rail-section-item=""
        data-tooltip={open ? undefined : label}
        data-tooltip-position="right"
        onClick={() => setOpen((was) => !was)}
      >
        <Styled.FolderIcons>
          {items.slice(0, 4).map((item) => (
            <Icon key={item.id} icon={item.icon} />
          ))}
        </Styled.FolderIcons>
        <Styled.Label>{label}</Styled.Label>
      </Styled.FolderTile>
      {open && (
        // a click on one of its items opens it and closes the group
        <Styled.FolderPanel
          ref={panelRef}
          className={up ? 'up' : undefined}
          data-rail-folder-panel=""
          onClick={() => later(false, 0)}
        >
          {items.map(renderItem)}
        </Styled.FolderPanel>
      )}
    </Styled.FolderWrap>
  )
}

export default RailFolder
