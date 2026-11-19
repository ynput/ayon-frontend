import {
  FC,
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
import { format, formatDistanceToNowStrict } from 'date-fns'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useLocalStorage } from '@shared/hooks'
import { useContextMenu } from '@shared/containers/ContextMenu'
import { clampScale, getTicks } from '@pages/EventsPage/utils/timeScale'
import type { SettingsChange } from '@queries/settingsHistory/getSettingsHistory'
import { COMPARE_COLOR, lastIndexAtOrBefore } from './settingsHistoryHelpers'
import type { HistoryLane } from './useSettingsHistory'
import { SettingsChangeSummary } from './SettingsChangeSummary'
import { SaveAvatar, SettingsChangeList } from './SettingsChangeList'
import * as Styled from './SettingsTimeline.styled'
import { AVATAR, AXIS_HEIGHT, GUTTER } from './SettingsTimeline.styled'

const DAY = 86_400_000
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

type View = { start: number; end: number }

/** Saves drawn as one mark, `left` is the first avatar's left edge, `users` newest first */
type Mark = { key: string; left: number; width: number; changes: SettingsChange[]; users: string[] }

type Segment = { version: string; from: number; to: number }

/** `pinned`: opened with a click, stays open until a click elsewhere */
type Popover = { lane: HistoryLane; mark: Mark; left: number; top: number; pinned: boolean } | null

const getUsers = (changes: SettingsChange[]) => [
  ...new Set([...changes].reverse().map((change) => change.user ?? '')),
]

/** Stacked avatars and, for several saves, their count */
const getMarkWidth = (users: number, count: number) =>
  count === 1
    ? AVATAR
    : AVATAR + (Math.min(users, MAX_STACK) - 1) * STACK_STEP + 10 + String(count).length * 7

/** Saves whose avatars would overlap are drawn as one mark */
const buildMarks = (
  changes: SettingsChange[],
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

/** Spans of time each version was the one being saved, the shown version runs until now */
const buildSegments = (lane: HistoryLane, now: number): Segment[] => {
  const segments: Segment[] = []
  for (const change of lane.changes) {
    const last = segments[segments.length - 1]
    if (last) last.to = change.createdAt
    if (last?.version === change.addonVersion) continue
    segments.push({ version: change.addonVersion, from: change.createdAt, to: change.createdAt })
  }
  const last = segments[segments.length - 1]
  if (last?.version === lane.currentVersion) last.to = now
  return segments
}

/** The save at `index` is the last one of the version shown: its settings are the current ones */
const isCurrentState = (lane: HistoryLane, index: number) =>
  index >= 0 &&
  index === lane.changes.length - 1 &&
  lane.changes[index].addonVersion === lane.currentVersion

const fitView = (lanes: HistoryLane[], now: number): View => {
  const first = Math.min(...lanes.map((lane) => lane.changes[0]?.createdAt ?? now))
  const span = Math.max(now - first, 7 * DAY)
  return { start: now - span * 1.04, end: now + span * 0.04 }
}

type Props = {
  lanes: HistoryLane[]
  schemas: Record<string, any>
  compareAt: number | null
  onCompareAtChange: (time: number | null) => void
  isLoading?: boolean
}

export const SettingsTimeline: FC<Props> = ({
  lanes,
  schemas,
  compareAt,
  onCompareAtChange,
  isLoading,
}) => {
  const [collapsed, setCollapsed] = useLocalStorage('settings-history-collapsed', false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [view, setView] = useState<View | null>(null)
  const [popover, setPopover] = useState<Popover>(null)
  const [isDragging, setIsDragging] = useState(false)

  const plotWidth = Math.max(1, width - GUTTER)
  const allChanges = useMemo(
    () => lanes.flatMap((lane) => lane.changes).sort((a, b) => a.createdAt - b.createdAt),
    [lanes],
  )
  const latest = allChanges[allChanges.length - 1]
  // comparing with the latest save shows nothing when every addon's last save is of the version
  // shown, the arrow keys then stop one save earlier
  const latestIsCurrent = lanes.every(
    (lane) => !lane.changes.length || isCurrentState(lane, lane.changes.length - 1),
  )
  const lastStep = allChanges.length - (latestIsCurrent ? 2 : 1)

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
  const fitKey = lanes.map((lane) => `${lane.addonName}@${lane.currentVersion}`).join('|')
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
      onCompareAtChange(time)
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

  const openPopover = (lane: HistoryLane, mark: Mark, e: React.MouseEvent, pinned = false) => {
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

  const handleMarkClick = (lane: HistoryLane, mark: Mark, e: React.MouseEvent) => {
    if (suppressClick.current) return
    bodyRef.current?.focus({ preventScroll: true })
    if (mark.changes.length === 1) {
      setPopover((open) => (open?.pinned ? null : open))
      onCompareAtChange(mark.changes[0].createdAt)
      return
    }
    if (popover?.pinned && popover.mark.key === mark.key) setPopover(null)
    else openPopover(lane, mark, e, true)
  }

  const pickChange = (change: SettingsChange) => {
    setPopover(null)
    onCompareAtChange(change.createdAt)
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
        let index = lastStep
        if (compareAt !== null) {
          const at = lastIndexAtOrBefore(allChanges, compareAt)
          const onChange = allChanges[at]?.createdAt === compareAt
          index = e.key === 'ArrowLeft' ? (onChange ? at - 1 : at) : at + 1
        } else if (e.key === 'ArrowRight') {
          return
        }
        // stepping past the last save that differs from now: stop comparing
        if (index > lastStep) {
          onCompareAtChange(null)
          return
        }
        // before the first save: the settings it started from
        const time = index < 0 ? allChanges[0].createdAt - 1000 : allChanges[index].createdAt
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
    if (compareAt === null || isContextOpen) return
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

  const ticks = useMemo(
    () => getTicks(current.start, current.end, msPerPx),
    [current.start, current.end, msPerPx],
  )
  const marks = useMemo(
    () => lanes.map((lane) => buildMarks(lane.changes, current.start, current.end, msPerPx)),
    [lanes, current.start, current.end, msPerPx],
  )
  const segments = useMemo(() => lanes.map((lane) => buildSegments(lane, now)), [lanes, now])

  const compareX = compareAt !== null ? timeToX(compareAt) : null
  const nowX = timeToX(now)
  const changesSince =
    compareAt === null ? 0 : allChanges.length - 1 - lastIndexAtOrBefore(allChanges, compareAt)
  const style = { '--compare-color': COMPARE_COLOR } as React.CSSProperties

  const header = (
    <Styled.Header>
      <Button
        variant="text"
        icon={collapsed ? 'chevron_right' : 'expand_more'}
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Show settings history' : 'Hide settings history'}
        style={{ padding: 2 }}
      />
      <span className="title">
        <Icon icon="history" />
        History
      </span>
      {compareAt !== null ? (
        <Styled.CompareChip>
          <span className="label">
            Comparing with <strong>{format(compareAt, 'EEE d MMM yyyy, HH:mm')}</strong>
            {` · ${changesSince} save${changesSince === 1 ? '' : 's'} since`}
          </span>
          <Button
            variant="text"
            icon="close"
            onClick={() => onCompareAtChange(null)}
            data-tooltip="Stop comparing (Esc)"
            aria-label="Stop comparing"
          />
        </Styled.CompareChip>
      ) : (
        <span className="summary">
          {isLoading
            ? 'Loading…'
            : latest
            ? `Last saved ${formatDistanceToNowStrict(latest.createdAt, { addSuffix: true })}${
                latest.user ? ` by ${latest.user}` : ''
              }`
            : 'No saved changes'}
        </span>
      )}
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
    <Styled.Wrapper style={{ ...style, containerType: 'inline-size' }}>
      {header}
      {!collapsed && (
        <Styled.Body
          ref={bodyRef}
          className={clsx({ dragging: isDragging })}
          tabIndex={0}
          role="application"
          aria-roledescription="timeline"
          aria-label="Settings history. Left and right arrows compare with the previous or next save, plus and minus zoom, Escape stops comparing."
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
          {/* grid and compared range, behind the marks */}
          <Styled.Overlay style={{ left: GUTTER, right: 0 }} aria-hidden>
            {ticks.map((tick) => (
              <Styled.GridLine
                key={tick.time}
                className={clsx({ major: tick.major })}
                style={{ left: timeToX(tick.time) }}
              />
            ))}
            {compareX !== null && (
              <Styled.SinceRange
                style={{ left: Math.max(compareX, 0), width: Math.max(0, nowX - compareX) }}
              />
            )}
          </Styled.Overlay>

          {lanes.map((lane, laneIndex) => (
            <Styled.Lane
              key={lane.addonName}
              style={{ '--lane-color': lane.color } as React.CSSProperties}
            >
              <Styled.GutterCell title={`${lane.title} ${lane.currentVersion}`}>
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
                      title="Older saves were not loaded"
                    />
                  )}
                {segments[laneIndex].map((segment) => {
                  const left = timeToX(segment.from)
                  const right = timeToX(segment.to)
                  if (right < 0 || left > plotWidth) return null
                  const isCurrent = segment.version === lane.currentVersion
                  const labelLeft = Math.max(left, 0)
                  return (
                    <span key={`${segment.version}-${segment.from}`}>
                      <Styled.VersionSegment
                        className={clsx({ current: isCurrent })}
                        style={{ left, width: Math.max(1, right - left) }}
                      />
                      {right - labelLeft > 56 && (
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
                        selected: mark.changes.some((c) => c.createdAt === compareAt),
                        open: popover?.mark.key === mark.key,
                      })}
                      style={{ left: mark.left, width: mark.width }}
                      onClick={(e) => handleMarkClick(lane, mark, e)}
                      onMouseEnter={(e) => openPopover(lane, mark, e)}
                      onMouseLeave={scheduleClose}
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

          <Styled.Axis aria-hidden>
            <Styled.GutterCell />
            <Styled.Plot>
              {ticks
                .filter((tick) => {
                  const x = timeToX(tick.time)
                  return x > 28 && x < plotWidth - 28
                })
                .map((tick) => (
                  <Styled.TickLabel
                    key={tick.time}
                    className={clsx({ major: tick.major })}
                    style={{ left: timeToX(tick.time) }}
                  >
                    {tick.label}
                  </Styled.TickLabel>
                ))}
              {compareX !== null && compareX >= 0 && compareX <= plotWidth && (
                <Styled.AxisFlag className="compare" style={{ left: compareX }}>
                  {format(compareAt!, 'd MMM, HH:mm')}
                </Styled.AxisFlag>
              )}
            </Styled.Plot>
          </Styled.Axis>

          {/* lines above the marks */}
          <Styled.Overlay style={{ left: GUTTER, right: 0, overflow: 'hidden' }} aria-hidden>
            {nowX >= 0 && nowX <= plotWidth && (
              <Styled.NowLine style={{ left: nowX }} title="Now" />
            )}
            {compareX !== null && <Styled.CompareLine style={{ left: compareX - 1 }} />}
          </Styled.Overlay>

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
                {popover.mark.changes.length > 1 ? (
                  <SettingsChangeList
                    lane={popover.lane}
                    changes={popover.mark.changes}
                    compareAt={compareAt}
                    onPick={pickChange}
                  />
                ) : (
                  <ChangeSummary
                    lane={popover.lane}
                    change={popover.mark.changes[0]}
                    schema={schemas[popover.lane.addonName]}
                  />
                )}
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
      <Styled.HoverLine style={{ left: x, bottom: AXIS_HEIGHT }} />
      <Styled.AxisFlag style={{ left: x, top: 'auto', bottom: 3 }}>
        {format(time, 'd MMM yyyy, HH:mm')}
      </Styled.AxisFlag>
    </Styled.Overlay>
  )
}

const ChangeSummary: FC<{ lane: HistoryLane; change: SettingsChange; schema?: any }> = ({
  lane,
  change,
  schema,
}) => {
  const index = lane.changes.indexOf(change)
  return (
    <SettingsChangeSummary
      change={change}
      previous={lane.changes[index - 1]}
      isLatest={isCurrentState(lane, index)}
      lane={lane}
      schema={schema}
    />
  )
}
