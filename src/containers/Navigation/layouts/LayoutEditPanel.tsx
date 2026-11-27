import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { isEqual } from 'lodash'
import clsx from 'clsx'
import { Button, Icon, SaveButton } from '@ynput/ayon-react-components'
import { getRequestErrorString } from '@shared/util'
import Type from '@/theme/typography.module.css'
import { applyEdits, setIconsOnly } from './applyLayout'
import { changeDraft, saveEdit, stopEditing, useLayoutEdit, type LayoutEdit } from './layoutEditor'
import { getPins } from './pins'
import * as Styled from './LayoutEditPanel.styled'

// where the viewer left the panel: its distance from the window's bottom right corner
const OFFSET_KEY = 'layout-edit-panel-offset'
const DEFAULT_OFFSET = { right: 24, bottom: 24 }
type Offset = typeof DEFAULT_OFFSET

const readOffset = (): Offset => {
  try {
    const stored = JSON.parse(localStorage.getItem(OFFSET_KEY) ?? 'null')
    if (Number.isFinite(stored?.right) && Number.isFinite(stored?.bottom)) return stored
  } catch {
    // no storage (a private window): where it starts
  }
  return DEFAULT_OFFSET
}

const keepOffset = (offset: Offset) => {
  try {
    localStorage.setItem(OFFSET_KEY, JSON.stringify(offset))
  } catch {
    // not kept: it starts in its corner next time
  }
}

/**
 * The panel floating over the app while a layout is edited, on every page: what is edited, how to
 * change the sidebar and the tab rows, the layout's options, Cancel and Save. Save puts the
 * sidebar, the tab rows, the pins and the options into the layout (or the user's copy of it).
 * Drag it by its header when it covers something; where it was left is kept in this browser.
 */
const LayoutEditPanel = () => {
  const edit = useLayoutEdit()
  return edit ? <Panel edit={edit} /> : null
}

const Panel = ({ edit }: { edit: LayoutEdit }) => {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  const panelRef = useRef<HTMLElement>(null)
  const [offset, setOffset] = useState(readOffset)
  // always the whole panel in the window, also after the window got smaller
  const clamp = useCallback((next: Offset): Offset => {
    const panel = panelRef.current
    if (!panel) return next
    const fit = (value: number, room: number) => Math.round(Math.min(Math.max(value, 0), room))
    return {
      right: fit(next.right, window.innerWidth - panel.offsetWidth),
      bottom: fit(next.bottom, window.innerHeight - panel.offsetHeight),
    }
  }, [])
  useLayoutEffect(() => {
    setOffset((current) => clamp(current))
    const onResize = () => setOffset((current) => clamp(current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clamp])

  // dragged by its header; the pointer is captured, so the drag goes on over an addon's iframe
  const drag = useRef<{ x: number; y: number; from: Offset } | null>(null)
  const [dragging, setDragging] = useState(false)
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, from: offset }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const start = drag.current
    if (!start) return
    setOffset(
      clamp({
        right: start.from.right - (e.clientX - start.x),
        bottom: start.from.bottom - (e.clientY - start.y),
      }),
    )
  }
  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
  }
  useEffect(() => {
    if (!dragging) keepOffset(offset)
  }, [dragging, offset])

  const cancel = () => {
    stopEditing()
    // a tab pinned in this edit goes with it: when it is open, back to the page with its own view,
    // as after Unpin
    const params = new URLSearchParams(search)
    const open = params.get('view')
    const pinned = (layout: typeof edit.draft) => getPins(layout).some((pin) => pin.id === open)
    if (!open || !pinned(edit.draft) || pinned(edit.initial)) return
    params.delete('view')
    const rest = params.toString()
    navigate(rest ? `${pathname}?${rest}` : pathname)
  }

  const changed = !isEqual(edit.initial, edit.draft)
  const save = () =>
    saveEdit(applyEdits).catch((error) =>
      toast.error(`Couldn't save the layout: ${getRequestErrorString(error)}`),
    )

  const iconsOnly = !!edit.draft.iconsOnly
  const showIcons = (on: boolean) => changeDraft((draft) => setIconsOnly(draft, on))

  return (
    <Styled.Panel
      ref={panelRef}
      aria-label="Editing layout"
      data-layout-edit-panel=""
      style={{ right: offset.right, bottom: offset.bottom }}
    >
      <Styled.Header
        className={clsx({ dragging })}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        data-tooltip="Drag to move"
        data-tooltip-delay={800}
      >
        <Icon icon="drag_indicator" />
        <h2 className={Type.titleMedium}>Editing layout &ldquo;{edit.name}&rdquo;</h2>
      </Styled.Header>
      <Styled.Hint className={Type.bodyMedium}>
        Hide or show sidebar items and tabs with the eye, drag them to reorder.
      </Styled.Hint>
      <Styled.Rows>
        {/* the sidebar's items with their names, or their icons only (names on hover) */}
        <Styled.Row>
          <span className={Type.labelLarge}>Sidebar</span>
          <Styled.Choice role="group" aria-label="Sidebar">
            <button
              type="button"
              aria-pressed={!iconsOnly}
              disabled={edit.saving}
              onClick={() => showIcons(false)}
            >
              <Icon icon="view_sidebar" />
              Names
            </button>
            <button
              type="button"
              aria-pressed={iconsOnly}
              disabled={edit.saving}
              onClick={() => showIcons(true)}
            >
              <Icon icon="left_panel_close" />
              Icons only
            </button>
          </Styled.Choice>
        </Styled.Row>
      </Styled.Rows>
      <Styled.Footer>
        <Button variant="text" label="Cancel" disabled={edit.saving} onClick={cancel} />
        <SaveButton
          label="Save layout"
          active={changed && !edit.saving}
          saving={edit.saving}
          onClick={save}
        />
      </Styled.Footer>
    </Styled.Panel>
  )
}

export default LayoutEditPanel
