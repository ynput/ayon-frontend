import {
  FC,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { format } from 'date-fns'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useLocalStorage } from '@shared/hooks'
import { useContextMenu } from '@shared/containers/ContextMenu'
import { beforeSave, DATE_FORMAT, lastIndexAtOrBefore } from './settingsHistoryHelpers'
import { SaveAvatar } from './SettingsChangeList'
import { getTimeAxis } from './timeAxis'
import { HoveredSaves, useHoveredSaves } from './hoveredSaves'
import * as Styled from './SettingsTimeline.styled'
import { AVATAR, AXIS_HEIGHT, GUTTER } from './SettingsTimeline.styled'

const DAY = 86_400_000
/** from about a minute to a couple of years across the timeline */
const MIN_MS_PER_PX = 1000
const MAX_MS_PER_PX = 2 * DAY
const clampScale = (msPerPx: number) => Math.min(MAX_MS_PER_PX, Math.max(MIN_MS_PER_PX, msPerPx))
/** whether an axis label fits a width, roughly, the labels are short */
const fits = (text: string, px: number) => text.length * 7 <= px
/** width of the compared time on the axis */
const COMPARE_FLAG = 124
const PRESETS = [
  { label: '1w', span: 7 * DAY },
  { label: '1m', span: 30 * DAY },
  { label: '3m', span: 91 * DAY },
  { label: '1y', span: 365 * DAY },
]
const DRAG_THRESHOLD = 4
const MARK_GAP = 3
/** avatars shown in a mark of several saves, and how much of each one behind the first shows */
const MAX_STACK = 3
const STACK_STEP = 10
/** time to move the pointer from a mark to its popover */
const CLOSE_DELAY = 200

/** A change on the timeline: when and by whom */
export type TimelineChange = { id: string; createdAt: number; user: string | null }

/**
 * A row of changes. The line under them shows which value each change set (`valueOf`), the
 * `current` value runs until now. A null value draws no line, an empty one draws it without a label.
 */
export type TimelineLane<C extends TimelineChange = TimelineChange> = {
  key: string
  title: string
  color: string
  current: string | null
  /** ascending */
  changes: C[]
  /** older changes were not loaded */
  truncated?: boolean
}

type View = { start: number; end: number }

/** Saves drawn as one mark, `left` is the first avatar's left edge, `users` newest first */
type Mark = { key: string; left: number; width: number; changes: TimelineChange[]; users: string[] }

type Segment = { version: string | null; from: number; to: number }

/** `pinned`: opened with a click, stays open until a click elsewhere */
type Popover<L> = { lane: L; mark: Mark; left: number; top: number; pinned: boolean } | null

const getUsers = (changes: TimelineChange[]) => [
  ...new Set([...changes].reverse().map((change) => change.user ?? '')),
]

/** Stacked avatars and, for several saves, their count */
const getMarkWidth = (users: number, count: number) =>
  count === 1
    ? AVATAR
    : AVATAR + (Math.min(users, MAX_STACK) - 1) * STACK_STEP + 10 + String(count).length * 7

/** Saves whose avatars would overlap are drawn as one mark */
const buildMarks = (
  changes: TimelineChange[],
  start: number,
  end: number,
  msPerPx: number,
): Mark[] => {
  const pad = 60 * msPerPx
  const marks: Mark[] = []
  let current: Mark | null = null
  for (const change of changes) {
    if (change.createdAt < start - pad || change.createdAt > end + pad) continue
    const left = (change.createdAt - start) / msPerPx - AVATAR / 2
    if (current && left <= current.left + current.width + MARK_GAP) {
      current.changes.push(change)
      current.users = getUsers(current.changes)
      // wide enough for its avatars, and to reach its last save
      current.width = Math.max(
        getMarkWidth(current.users.length, current.changes.length),
        left + AVATAR - current.left,
      )
      continue
    }
    current = { key: change.id, left, width: AVATAR, changes: [change], users: [change.user ?? ''] }
    marks.push(current)
  }
  return marks
}

/** Spans of time each value was the one set, the current value runs until now */
const buildSegments = <C extends TimelineChange>(
  lane: TimelineLane<C>,
  valueOf: (change: C) => string | null,
  now: number,
): Segment[] => {
  const segments: Segment[] = []
  for (const change of lane.changes) {
    const last = segments[segments.length - 1]
    if (last) last.to = change.createdAt
    const version = valueOf(change)
    if (last?.version === version) continue
    segments.push({ version, from: change.createdAt, to: change.createdAt })
  }
  const last = segments[segments.length - 1]
  if (last?.version === lane.current) last.to = now
  return segments
}

const fitView = (lanes: TimelineLane[], now: number): View => {
  const first = Math.min(...lanes.map((lane) => lane.changes[0]?.createdAt ?? now))
  const span = Math.max(now - first, 7 * DAY)
  return { start: now - span * 1.04, end: now + span * 0.04 }
}

type LaneChange<L extends TimelineLane> = L['changes'][number]

type Props<L extends TimelineLane> = {
  lanes: L[]
  /** the value a change set its lane to, see `TimelineLane` */
  valueOf: (change: LaneChange<L>) => string | null
  /** popover of one change */
  renderChange: (lane: L, change: LaneChange<L>) => ReactNode
  /** popover of the changes of a mark, to pick one from */
  renderChanges: (
    lane: L,
    changes: LaneChange<L>[],
    pick: (change: LaneChange<L>) => void,
  ) => ReactNode
  /** a change was clicked, or picked from a mark */
  onPick?: (lane: L, change: LaneChange<L>) => void
  /** epoch ms compared with, without `onCompareAtChange` the timeline does not compare */
  compareAt?: number | null
  onCompareAtChange?: (time: number | null) => void
  isLoading?: boolean
  hoveredSaves?: HoveredSaves
  /** local storage key of the collapsed state */
  storageKey: string
  /** what the timeline shows and how to use it, for screen readers */
  label: string
}

const noHoveredSaves: HoveredSaves = {
  get: () => null,
  set: () => {},
  subscribe: () => () => {},
}

export const SettingsTimeline = <L extends TimelineLane>({
  lanes,
  valueOf,
  renderChange,
  renderChanges,
  onPick,
  compareAt: compareAtProp,
  onCompareAtChange,
  isLoading,
  hoveredSaves = noHoveredSaves,
  storageKey,
  label,
}: Props<L>) => {
  const compareAt = compareAtProp ?? null
  const [collapsed, setCollapsed] = useLocalStorage(storageKey, false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [view, setView] = useState<View | null>(null)
  const [popover, setPopover] = useState<Popover<L>>(null)
  const [isDragging, setIsDragging] = useState(false)

  const plotWidth = Math.max(1, width - GUTTER)
  const allChanges = useMemo(
    () =>
      lanes
        .flatMap((lane) => lane.changes as TimelineChange[])
        .sort((a, b) => a.createdAt - b.createdAt),
    [lanes],
  )
  // --- measure ---
  useLayoutEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [collapsed])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  // --- fit the history of the shown addons once it is loaded ---
  const fitKey = lanes.map((lane) => `${lane.key}@${lane.current}`).join('|')
  const fittedFor = useRef<string | null>(null)
  useEffect(() => {
    if (isLoading || fittedFor.current === fitKey) return
    fittedFor.current = fitKey
    setView(fitView(lanes, Date.now()))
  }, [fitKey, isLoading, lanes])

  const current = view ?? fitView(lanes, now)
  const msPerPx = (current.end - current.start) / plotWidth
  const span = current.end - current.start
  const timeToX = (t: number) => (t - current.start) / msPerPx

  // never drift far past now, there is nothing there
  const updateView = useCallback(
    (updater: (v: View) => View) =>
      setView((v) => {
        const next = updater(v ?? fitView(lanes, Date.now()))
        const limit = Date.now() + (next.end - next.start) * 0.25
        return next.end > limit ? { start: next.start - (next.end - limit), end: limit } : next
      }),
    [lanes],
  )

  const zoomAt = useCallback(
    (factor: number, anchorX: number) =>
      updateView((v) => {
        const scale = (v.end - v.start) / plotWidth
        const next = clampScale(scale * factor)
        const anchor = v.start + anchorX * scale
        const start = anchor - anchorX * next
        return { start, end: start + plotWidth * next }
      }),
    [updateView, plotWidth],
  )

  const panBy = useCallback(
    (px: number) =>
      updateView((v) => {
        const shift = px * ((v.end - v.start) / plotWidth)
        return { start: v.start + shift, end: v.end + shift }
      }),
    [updateView, plotWidth],
  )

  const showSpan = (presetSpan: number) =>
    updateView(() => ({
      start: Date.now() - presetSpan * 0.97,
      end: Date.now() + presetSpan * 0.03,
    }))

  // --- wheel: vertical zooms around the cursor, horizontal and shift pan ---
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const x = e.clientX - el.getBoundingClientRect().left - GUTTER
      if (x < 0) return
      e.preventDefault()
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        panBy(e.shiftKey ? e.deltaY : e.deltaX)
      } else {
        zoomAt(Math.exp((e.ctrlKey ? e.deltaY * 4 : e.deltaY) * 0.002), x)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [panBy, zoomAt, collapsed])

  // --- drag pans, a click on empty space compares with that moment ---
  const drag = useRef<{ x: number; view: View; moved: boolean; pointerId: number } | null>(null)
  const suppressClick = useRef(false)

  const plotX = (clientX: number) =>
    clientX - (bodyRef.current?.getBoundingClientRect().left ?? 0) - GUTTER

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || plotX(e.clientX) < 0) return
    drag.current = { x: e.clientX, view: current, moved: false, pointerId: e.pointerId }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setIsDragging(true)
      setPopover(null)
      bodyRef.current?.setPointerCapture(d.pointerId)
    }
    const shift = dx * ((d.view.end - d.view.start) / plotWidth)
    updateView(() => ({ start: d.view.start - shift, end: d.view.end - shift }))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setIsDragging(false)
    if (d?.moved) {
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false))
      return
    }
    const x = plotX(e.clientX)
    const time = current.start + x * msPerPx
    // nothing to compare with after now
    if (d && x >= 0 && time <= Date.now() && !(e.target as HTMLElement).closest('[data-mark]')) {
      onCompareAtChange?.(time)
    }
  }

  // --- popover: what a save changed, or the saves of a mark to pick one from ---
  const closeTimer = useRef<number>()
  const cancelClose = () => window.clearTimeout(closeTimer.current)
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = window.setTimeout(
      () => setPopover((open) => (open?.pinned ? open : null)),
      CLOSE_DELAY,
    )
  }
  useEffect(() => cancelClose, [])

  const openPopover = (lane: L, mark: Mark, e: React.MouseEvent, pinned = false) => {
    if (drag.current?.moved) return
    cancelClose()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const width = mark.changes.length > 1 ? Styled.LIST_WIDTH : Styled.TOOLTIP_WIDTH
    const next = {
      lane,
      mark,
      left: Math.max(8, Math.min(rect.left - 12, window.innerWidth - width - 16)),
      top: rect.bottom + 6,
      pinned,
    }
    // hovering other marks leaves an opened list alone
    setPopover((open) => (open?.pinned && !pinned ? open : next))
  }

  // a list opened with a click closes with a click elsewhere, or Escape
  useEffect(() => {
    if (!popover?.pinned) return
    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest?.('[data-mark-popover], [data-mark]')) return
      setPopover(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setPopover(null)
    }
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [popover?.pinned])

  // the marks move when zooming or panning
  useEffect(() => setPopover(null), [view])

  const handleMarkClick = (lane: L, mark: Mark, e: React.MouseEvent) => {
    if (suppressClick.current) return
    bodyRef.current?.focus({ preventScroll: true })
    if (mark.changes.length === 1) {
      setPopover((open) => (open?.pinned ? null : open))
      onPick?.(lane, mark.changes[0] as LaneChange<L>)
      return
    }
    if (popover?.pinned && popover.mark.key === mark.key) setPopover(null)
    else openPopover(lane, mark, e, true)
  }

  const pickChange = (lane: L, change: LaneChange<L>) => {
    setPopover(null)
    onPick?.(lane, change)
    bodyRef.current?.focus({ preventScroll: true })
  }

  // --- keyboard: arrows step the compared time through the changes ---
  const keepVisible = (time: number) => {
    const x = timeToX(time)
    if (x >= 16 && x <= plotWidth - 16) return
    updateView((v) => {
      const half = (v.end - v.start) / 2
      return { start: time - half, end: time + half }
    })
  }

  // a save picked in the side panel can be out of view
  const keepVisibleRef = useRef(keepVisible)
  keepVisibleRef.current = keepVisible
  useEffect(() => {
    if (compareAt !== null) keepVisibleRef.current(compareAt)
  }, [compareAt])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        if (!allChanges.length) return
        e.preventDefault()
        if (e.shiftKey) {
          panBy((e.key === 'ArrowLeft' ? -1 : 1) * plotWidth * 0.25)
          return
        }
        if (!onCompareAtChange) return
        // step to the save before or after the compared time, the latest one when not comparing
        let index: number
        if (compareAt === null) {
          if (e.key === 'ArrowRight') return
          index = allChanges.length - 1
        } else {
          const next = lastIndexAtOrBefore(allChanges, compareAt) + 1
          const atSave = next < allChanges.length && beforeSave(allChanges[next]) === compareAt
          index = e.key === 'ArrowLeft' ? next - 1 : atSave ? next + 1 : next
          // saves of the same moment compare the same
          while (index < allChanges.length && beforeSave(allChanges[index]) === compareAt) index++
        }
        if (index < 0) return
        // past the latest save: stop comparing
        if (index >= allChanges.length) {
          onCompareAtChange(null)
          return
        }
        const time = beforeSave(allChanges[index])
        onCompareAtChange(time)
        keepVisible(time)
        return
      }
      case '+':
      case '=':
        e.preventDefault()
        zoomAt(0.5, compareAt !== null ? timeToX(compareAt) : plotWidth / 2)
        return
      case '-':
      case '_':
        e.preventDefault()
        zoomAt(2, compareAt !== null ? timeToX(compareAt) : plotWidth / 2)
        return
    }
  }

  // Escape stops comparing from anywhere on the page, unless something else uses it
  const { isContextOpen } = useContextMenu()
  useEffect(() => {
    if (compareAt === null || !onCompareAtChange || isContextOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const target = e.target as HTMLElement | null
      const owners =
        'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="listbox"], [role="menu"]'
      if (target?.closest?.(owners)) return
      onCompareAtChange(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [compareAt, onCompareAtChange, isContextOpen])

  const axis = useMemo(
    () => getTimeAxis(current.start, current.end, msPerPx),
    [current.start, current.end, msPerPx],
  )
  const hoveredIds = useHoveredSaves(hoveredSaves)
  const hovered = useMemo(() => new Set(hoveredIds ?? []), [hoveredIds])
  const marks = useMemo(
    () => lanes.map((lane) => buildMarks(lane.changes, current.start, current.end, msPerPx)),
    [lanes, current.start, current.end, msPerPx],
  )
  const segments = useMemo(
    () => lanes.map((lane) => buildSegments(lane, valueOf, now)),
    [lanes, valueOf, now],
  )

  const compareX = compareAt !== null ? timeToX(compareAt) : null
  const nowX = timeToX(now)
  const cellStyle = (cell: { start: number; end: number }) => ({
    left: timeToX(cell.start),
    width: (cell.end - cell.start) / msPerPx,
  })

  const header = (
    <Styled.Header>
      <Button
        variant="text"
        icon={collapsed ? 'chevron_right' : 'expand_more'}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Show history' : 'Hide history'}
        style={{ padding: 2 }}
      />
      <span className="title">
        <Icon icon="history" />
        History
      </span>
      <span className="spacer" />
      {!collapsed && (
        <span className="presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              className={clsx('preset', {
                active: Math.abs(span - preset.span) / preset.span < 0.05,
              })}
              onClick={() => showSpan(preset.span)}
            >
              {preset.label}
            </button>
          ))}
          <button className="preset" onClick={() => setView(fitView(lanes, Date.now()))}>
            All
          </button>
        </span>
      )}
    </Styled.Header>
  )

  return (
    <Styled.Wrapper style={{ containerType: 'inline-size' }}>
      {header}
      {!collapsed && (
        <Styled.Body
          ref={bodyRef}
          className={clsx({ dragging: isDragging })}
          tabIndex={0}
          role="application"
          aria-roledescription="timeline"
          aria-label={label}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            drag.current = null
            setIsDragging(false)
          }}
          onPointerLeave={scheduleClose}
        >
          <Styled.AxisRows aria-hidden>
            <Styled.GutterCell />
            <Styled.Plot>
              {axis.primary.map((cell) => {
                const { left, width } = cellStyle(cell)
                // the label stays at the start of what shows of its cell, shorter when it does not fit
                const room = Math.min(left + width, plotWidth) - Math.max(left, 0) - 16
                const label = [cell.label, cell.short].find((text) => text && fits(text, room))
                return (
                  <Styled.AxisCell
                    key={cell.start}
                    className="top-row"
                    style={{ left, width, paddingLeft: Math.max(8, 8 - left) }}
                  >
                    {label}
                  </Styled.AxisCell>
                )
              })}
              {axis.secondary.map((cell) => {
                const { left, width } = cellStyle(cell)
                const visibleLeft = Math.max(left, 0)
                const room = Math.min(left + width, plotWidth) - visibleLeft - 8
                // times label their line, other cells are centred in what shows of them
                const fitting = axis.clock
                  ? left >= 0 && fits(cell.label, width - 8)
                  : fits(cell.label, room)
                // the compared time covers the labels around it
                const labelWidth = cell.label.length * 7
                const labelCenter = axis.clock
                  ? left + 4 + labelWidth / 2
                  : visibleLeft + 4 + room / 2
                const covered =
                  compareX !== null &&
                  Math.abs(labelCenter - compareX) < (labelWidth + COMPARE_FLAG) / 2
                const show = fitting && !covered
                return (
                  <Styled.AxisCell
                    key={cell.start}
                    className={clsx({ weekend: cell.weekend, clock: axis.clock })}
                    style={{
                      left,
                      width,
                      ...(!axis.clock && {
                        paddingLeft: Math.max(0, -left),
                        paddingRight: Math.max(0, left + width - plotWidth),
                      }),
                    }}
                  >
                    {show && cell.label}
                  </Styled.AxisCell>
                )
              })}
              {compareX !== null && compareX >= 0 && compareX <= plotWidth && (
                <Styled.AxisFlag className="compare" style={{ left: compareX }}>
                  {format(compareAt!, DATE_FORMAT)}
                </Styled.AxisFlag>
              )}
            </Styled.Plot>
          </Styled.AxisRows>

          {/* calendar grid, compared range and lines, behind the marks */}
          <Styled.Overlay style={{ left: GUTTER, right: 0, top: AXIS_HEIGHT }} aria-hidden>
            {axis.secondary
              .filter((cell) => cell.weekend)
              .map((cell) => (
                <Styled.Weekend key={cell.start} style={cellStyle(cell)} />
              ))}
            {axis.secondary.map((cell) => (
              <Styled.GridLine key={cell.start} style={{ left: timeToX(cell.start) }} />
            ))}
            {axis.primary.map((cell) => (
              <Styled.GridLine
                key={`primary-${cell.start}`}
                className="major"
                style={{ left: timeToX(cell.start) }}
              />
            ))}
            {compareX !== null && (
              <Styled.SinceRange
                style={{ left: Math.max(compareX, 0), width: Math.max(0, nowX - compareX) }}
              />
            )}
            {nowX >= 0 && nowX <= plotWidth && <Styled.NowLine style={{ left: nowX }} />}
            {compareX !== null && <Styled.CompareLine style={{ left: compareX - 1 }} />}
          </Styled.Overlay>

          {lanes.map((lane, laneIndex) => (
            <Styled.Lane
              key={lane.key}
              style={{ '--lane-color': lane.color } as React.CSSProperties}
            >
              <Styled.GutterCell title={[lane.title, lane.current].filter(Boolean).join(' ')}>
                <span className="swatch" style={{ backgroundColor: lane.color }} />
                <span className="label">{lane.title}</span>
                <span className="count">{lane.changes.length}</span>
              </Styled.GutterCell>
              <Styled.Plot>
                {lane.truncated &&
                  !!lane.changes.length &&
                  timeToX(lane.changes[0].createdAt) > 0 && (
                    <Styled.Unloaded
                      style={{ width: Math.min(timeToX(lane.changes[0].createdAt), plotWidth) }}
                      title="Older changes were not loaded"
                    />
                  )}
                {segments[laneIndex].map((segment) => {
                  const left = timeToX(segment.from)
                  const right = timeToX(segment.to)
                  if (segment.version === null || right < 0 || left > plotWidth) return null
                  const isCurrent = segment.version === lane.current
                  const labelLeft = Math.max(left, 0)
                  return (
                    <span key={`${segment.version}-${segment.from}`}>
                      <Styled.VersionSegment
                        className={clsx({ current: isCurrent })}
                        style={{ left, width: Math.max(1, right - left) }}
                      />
                      {!!segment.version && right - labelLeft > 56 && (
                        <Styled.VersionLabel
                          className={clsx({ current: isCurrent })}
                          style={{ left: labelLeft }}
                        >
                          {segment.version}
                        </Styled.VersionLabel>
                      )}
                    </span>
                  )
                })}
                {marks[laneIndex].map((mark) => {
                  const isCluster = mark.changes.length > 1
                  const last = mark.changes[mark.changes.length - 1]
                  return (
                    <Styled.Marker
                      key={mark.key}
                      data-mark
                      className={clsx({
                        cluster: isCluster,
                        before: compareAt !== null && last.createdAt < compareAt,
                        selected: mark.changes.some((c) => beforeSave(c) === compareAt),
                        open: popover?.mark.key === mark.key,
                        linked: mark.changes.some((change) => hovered.has(change.id)),
                      })}
                      style={{ left: mark.left, width: mark.width }}
                      onClick={(e) => handleMarkClick(lane, mark, e)}
                      onMouseEnter={(e) => {
                        openPopover(lane, mark, e)
                        hoveredSaves.set(mark.changes.map((change) => change.id))
                      }}
                      onMouseLeave={() => {
                        scheduleClose()
                        hoveredSaves.set(null)
                      }}
                    >
                      {mark.users.slice(0, MAX_STACK).map((user) => (
                        <SaveAvatar
                          key={user}
                          user={user || null}
                          size={AVATAR}
                          className="avatar"
                        />
                      ))}
                      {isCluster && <span className="count">{mark.changes.length}</span>}
                    </Styled.Marker>
                  )
                })}
              </Styled.Plot>
            </Styled.Lane>
          ))}

          {!isDragging && <HoverGuide bodyRef={bodyRef} start={current.start} msPerPx={msPerPx} />}

          {popover &&
            createPortal(
              <Styled.Tooltip
                data-mark-popover
                className={clsx({ list: popover.mark.changes.length > 1 })}
                style={{ left: popover.left, top: popover.top }}
                role={popover.mark.changes.length > 1 ? 'dialog' : 'tooltip'}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
                {popover.mark.changes.length > 1
                  ? renderChanges(popover.lane, popover.mark.changes as LaneChange<L>[], (change) =>
                      pickChange(popover.lane, change),
                    )
                  : renderChange(popover.lane, popover.mark.changes[0] as LaneChange<L>)}
              </Styled.Tooltip>,
              document.body,
            )}
        </Styled.Body>
      )}
    </Styled.Wrapper>
  )
}

/** Line and time under the cursor, own state so moving the mouse does not re-render the lanes */
const HoverGuide: FC<{ bodyRef: RefObject<HTMLDivElement>; start: number; msPerPx: number }> = ({
  bodyRef,
  start,
  msPerPx,
}) => {
  const [x, setX] = useState<number | null>(null)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      const px = e.clientX - el.getBoundingClientRect().left - GUTTER
      const overMark = (e.target as HTMLElement).closest?.('[data-mark]')
      setX(px >= 0 && !overMark ? px : null)
    }
    const onLeave = () => setX(null)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [bodyRef])

  const time = x === null ? null : start + x * msPerPx
  if (x === null || time === null || time > Date.now()) return null
  return (
    <Styled.Overlay style={{ left: GUTTER, right: 0 }} aria-hidden>
      <Styled.HoverLine style={{ left: x, top: AXIS_HEIGHT }} />
      <Styled.AxisFlag style={{ left: x }}>{format(time, DATE_FORMAT)}</Styled.AxisFlag>
    </Styled.Overlay>
  )
}
