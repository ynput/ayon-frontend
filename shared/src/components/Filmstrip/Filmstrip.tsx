import { CSSProperties, FC, useEffect, useLayoutEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import clsx from 'clsx'
import { FilmstripData, loadFilmstrip, peekFilmstrip } from './filmstripCache'
import { getVegasOffset, isVegasMode, subscribeVegasTick } from './vegasMode'

// Wait before loading, so sweeping the cursor over a grid does not load every card
const HOVER_INTENT_DELAY = 120

// Set on the host element while a frame is shown, so the host can hide its static image
export const FILMSTRIP_ACTIVE_ATTRIBUTE = 'data-filmstrip-active'
// Relative position (0-1) in the video of the frame shown
export const FILMSTRIP_POSITION_ATTRIBUTE = 'data-filmstrip-position'

// Clicking a thumbnail often re-renders it (selection), which replaces the element under
// a stationary cursor and the browser takes ~200ms to report the hover again. The last
// scrubbed filmstrip is restored right away, so the frame does not flicker back to the static
// thumbnail and a double click still knows the position.
let lastHover: { src: string; position: number } | null = null
const RESTORE_CHECK_DELAY = 400

/**
 * Relative position (0-1) in the video of the filmstrip frame shown under the cursor,
 * for opening the viewer at the frame the user was looking at.
 * Returns undefined when the event did not come from a scrubbed thumbnail.
 */
export const getFilmstripPosition = (event?: { target: EventTarget | null }) => {
  const target = event?.target
  if (!(target instanceof Element)) return undefined
  const host = target.closest(`[${FILMSTRIP_POSITION_ATTRIBUTE}]`)
  const value = Number(host?.getAttribute(FILMSTRIP_POSITION_ATTRIBUTE))
  return host && Number.isFinite(value) ? value : undefined
}

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  /* above EntityCard image (10) and table thumbnail (20), below EntityCard tags (100) */
  z-index: 25;
`

const Frame = styled.div`
  position: absolute;
  background-repeat: no-repeat;
`

const Progress = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  background-color: var(--md-sys-color-primary);
`

export interface FilmstripProps {
  /** Filmstrip URL (see getEntityFilmstripUrl). Nothing happens when empty. */
  src?: string | null
  /** Should match object-fit of the static thumbnail underneath */
  fit?: 'cover' | 'contain'
  disabled?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Hover-scrub preview of a video thumbnail.
 *
 * Render it as the last child of a positioned thumbnail element. While the cursor is over
 * that element, the overlay shows the filmstrip frame matching the cursor position,
 * so moving the cursor left to right "plays" the video.
 *
 * In vegas mode (`?vegas` in the URL) filmstrips load right away and play on their own.
 */
export const Filmstrip: FC<FilmstripProps> = ({
  src,
  fit = 'cover',
  disabled,
  className,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const positionRef = useRef(0) // relative cursor position 0-1
  const framesRef = useRef(0)
  const [hover, setHover] = useState<{ width: number; height: number } | null>(null)
  const [index, setIndex] = useState(0)
  const [vegas] = useState(isVegasMode)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [autoIndex, setAutoIndex] = useState(0)
  const [data, setData] = useState<FilmstripData | null | undefined>(() =>
    src ? peekFilmstrip(src) : undefined,
  )
  const enabled = !!src && !disabled

  useEffect(() => {
    setData(src ? peekFilmstrip(src) : undefined)
  }, [src])

  const updateIndex = () => {
    const frames = framesRef.current
    if (frames) setIndex(Math.min(Math.floor(positionRef.current * frames), frames - 1))
  }

  useLayoutEffect(() => {
    framesRef.current = data?.frames || 0
    updateIndex()
  }, [data])

  // track the cursor over the host (parent) element
  // layout effects: a re-mounted thumbnail keeps showing the frame without a flash
  useLayoutEffect(() => {
    const overlay = ref.current
    const host = overlay?.parentElement
    if (!overlay || !host || !enabled || !src) return

    let hovering = false
    let restoreCheck: number | undefined

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const rect = overlay.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      positionRef.current = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1)
      lastHover = { src, position: positionRef.current }
      if (!hovering) {
        // also covers elements that appeared under a stationary cursor
        hovering = true
        setHover({ width: rect.width, height: rect.height })
      }
      updateIndex()
    }

    const onLeave = () => {
      hovering = false
      setHover(null)
      if (lastHover?.src === src) lastHover = null
    }

    // same filmstrip re-mounted under the cursor
    const rect = overlay.getBoundingClientRect()
    if (lastHover?.src === src && rect.width && rect.height) {
      positionRef.current = lastHover.position
      hovering = true
      setHover({ width: rect.width, height: rect.height })
      updateIndex()
      // the cursor may have left in the meantime
      restoreCheck = window.setTimeout(() => {
        if (!host.matches(':hover')) onLeave()
      }, RESTORE_CHECK_DELAY)
    }

    host.addEventListener('pointerenter', onMove)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerleave', onLeave)
    return () => {
      window.clearTimeout(restoreCheck)
      host.removeEventListener('pointerenter', onMove)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerleave', onLeave)
      setHover(null)
    }
  }, [enabled, src])

  // load the filmstrip once the cursor rests on the thumbnail
  const isHovering = !!hover
  useEffect(() => {
    if (!isHovering || !enabled || !src || data !== undefined) return
    let cancelled = false
    const timeout = window.setTimeout(() => {
      loadFilmstrip(src).then((result) => {
        if (!cancelled) setData(result)
      })
    }, HOVER_INTENT_DELAY)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [isHovering, enabled, src, data])

  // vegas mode: load right away, play when not hovered
  useEffect(() => {
    if (!vegas || !enabled || !src || data !== undefined) return
    let cancelled = false
    loadFilmstrip(src).then((result) => {
      if (!cancelled) setData(result)
    })
    return () => {
      cancelled = true
    }
  }, [vegas, enabled, src, data])

  useLayoutEffect(() => {
    const overlay = ref.current
    if (!vegas || !overlay) return
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(overlay)
    return () => observer.disconnect()
  }, [vegas])

  const playing = vegas && enabled && !hover && !!data
  useEffect(() => {
    if (!playing || !data || !src) return
    const offset = getVegasOffset(src, data.frames)
    return subscribeVegasTick((tick) => setAutoIndex((tick + offset) % data.frames))
  }, [playing, data, src])

  const box = hover || (vegas ? size : null)
  const visible = enabled && !!box && !!box.width && !!box.height && !!data
  const shownIndex = hover ? index : autoIndex

  useLayoutEffect(() => {
    const host = ref.current?.parentElement
    if (!host || !visible) return
    host.setAttribute(FILMSTRIP_ACTIVE_ATTRIBUTE, '')
    return () => host.removeAttribute(FILMSTRIP_ACTIVE_ATTRIBUTE)
  }, [visible])

  // frame i shows the middle of the i-th segment of the video
  const position = visible && hover && data ? (index + 0.5) / data.frames : null
  useLayoutEffect(() => {
    const host = ref.current?.parentElement
    if (!host || position === null) return
    host.setAttribute(FILMSTRIP_POSITION_ATTRIBUTE, position.toFixed(4))
    return () => host.removeAttribute(FILMSTRIP_POSITION_ATTRIBUTE)
  }, [position])

  let frameStyle: CSSProperties | undefined
  if (visible && box && data) {
    const { width, height } = box
    const scale =
      fit === 'cover'
        ? Math.max(width / data.frameWidth, height / data.frameHeight)
        : Math.min(width / data.frameWidth, height / data.frameHeight)
    // whole pixels, so neighbouring frames never bleed in
    const frameWidth = Math.round(data.frameWidth * scale)
    const frameHeight = Math.round(data.frameHeight * scale)
    const rows = Math.ceil(data.frames / data.columns)
    const column = shownIndex % data.columns
    const row = Math.floor(shownIndex / data.columns)
    frameStyle = {
      left: Math.round((width - frameWidth) / 2),
      top: Math.round((height - frameHeight) / 2),
      width: frameWidth,
      height: frameHeight,
      backgroundImage: `url("${data.url}")`,
      backgroundSize: `${frameWidth * data.columns}px ${frameHeight * rows}px`,
      backgroundPosition: `${-column * frameWidth}px ${-row * frameHeight}px`,
    }
  }

  return (
    <Overlay ref={ref} aria-hidden className={clsx('filmstrip', className)} style={style}>
      {visible && data && (
        <>
          <Frame className="filmstrip-frame" style={frameStyle} />
          {hover && (
            <Progress
              className="filmstrip-progress"
              style={{ width: `${((index + 1) / data.frames) * 100}%` }}
            />
          )}
        </>
      )}
    </Overlay>
  )
}
