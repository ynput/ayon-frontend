import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { Button, Icon } from '@ynput/ayon-react-components'
import type { EventItem } from '../../types'
import { getCategoryMeta, getSeverity, getSeverityMeta, getStatusMeta } from '../../utils/eventMeta'
import {
  clampScale,
  getDayMarkers,
  getHistogramBucket,
  getTicks,
  MIN_MS_PER_PX,
  formatSpan,
  ZOOM_PRESETS,
} from '../../utils/timeScale'
import {
  buildHistogram,
  buildLanes,
  clusterLane,
  Cluster,
  getMarkerWidth,
  lowerBound,
} from './timelineLayout'
import * as Styled from './EventsTimeline.styled'
import { DAY_ROW_HEIGHT, GUTTER, AXIS_HEIGHT, HISTOGRAM_HEIGHT } from './EventsTimeline.styled'

export type TimelineViewState = {
  /** right edge of the view, epoch ms */
  end: number
  msPerPx: number
  /** keep the right edge pinned to "now" while new events stream in */
  follow: boolean
  initialised: boolean
}

export const INITIAL_TIMELINE_VIEW: TimelineViewState = {
  end: Date.now(),
  msPerPx: 3000,
  follow: true,
  initialised: false,
}

// stop loading older pages on its own after this many events, the user can keep going manually
const AUTO_LOAD_LIMIT = 5000
const DRAG_THRESHOLD = 4
const FOLLOW_MARGIN = 0.04

type HoverState = { cluster: Cluster; x: number; y: number } | null

export interface EventsTimelineProps {
  events: EventItem[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  view: TimelineViewState
  onViewChange: (updater: (view: TimelineViewState) => TimelineViewState) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  /** lower bound of the date filter, nothing exists before it */
  newerThan?: number
  /** upper bound of the date filter */
  olderThan?: number
}

export const EventsTimeline: FC<EventsTimelineProps> = ({
  events,
  selectedId,
  onSelect,
  view,
  onViewChange: setView,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  newerThan,
  olderThan,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [hover, setHover] = useState<HoverState>(null)
  const [isDragging, setIsDragging] = useState(false)

  const plotWidth = Math.max(1, width - GUTTER)

  // never let the view drift far past "now" (or the end of the date filter)
  const onViewChange = useCallback(
    (updater: (v: TimelineViewState) => TimelineViewState) =>
      setView((v) => {
        const next = updater(v)
        if (next.follow) return next
        const limit = (olderThan ?? Date.now()) + plotWidth * next.msPerPx * 0.25
        return next.end > limit ? { ...next, end: limit } : next
      }),
    [setView, plotWidth, olderThan],
  )
  const { msPerPx } = view
  const span = plotWidth * msPerPx
  const end = view.follow ? (olderThan ?? now) + span * FOLLOW_MARGIN : view.end
  const start = end - span

  // --- measure ---
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  // --- live clock, only needed while following ---
  useEffect(() => {
    if (!view.follow) return
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(interval)
  }, [view.follow, events[0]?.id])

  // --- initial fit: show roughly the latest 50 events ---
  useEffect(() => {
    if (view.initialised || !events.length || width === 0) return
    const newest = events[0].createdAt
    const reference = events[Math.min(49, events.length - 1)].createdAt
    const fitSpan = Math.max(10 * 60_000, (Date.now() - reference) * 1.15)
    onViewChange(() => ({
      end: Math.max(newest, Date.now()),
      msPerPx: clampScale(fitSpan / plotWidth),
      follow: true,
      initialised: true,
    }))
  }, [view.initialised, events, width, plotWidth, onViewChange])

  // --- data layout ---
  const lanes = useMemo(() => buildLanes(events), [events])
  const clusters = useMemo(
    () => lanes.map((lane) => clusterLane(lane, start, end, msPerPx)),
    [lanes, start, end, msPerPx],
  )
  const bucket = getHistogramBucket(msPerPx)
  const histogram = useMemo(
    () => buildHistogram(lanes, start, end, msPerPx, bucket),
    [lanes, start, end, msPerPx, bucket],
  )
  const maxBar = Math.max(1, ...histogram.map((b) => b.count))
  const ticks = useMemo(() => getTicks(start, end, msPerPx), [start, end, msPerPx])
  const dayMarkers = useMemo(() => getDayMarkers(start, end, msPerPx), [start, end, msPerPx])

  const indexById = useMemo(() => new Map(events.map((e, i) => [e.id, i])), [events])
  const selected = selectedId ? events[indexById.get(selectedId) ?? -1] : undefined

  const oldestLoaded = events[events.length - 1]?.createdAt ?? now
  const unloadedUntil = hasNextPage ? oldestLoaded : newerThan ?? null
  const visibleCount = useMemo(
    () =>
      lanes.reduce(
        (acc, lane) => acc + lowerBound(lane.events, end) - lowerBound(lane.events, start),
        0,
      ),
    [lanes, start, end],
  )

  // --- infinite loading as the view reaches unloaded history ---
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !view.initialised) return
    if (events.length >= AUTO_LOAD_LIMIT) return
    if (start < oldestLoaded) fetchNextPage()
  }, [
    hasNextPage,
    isFetchingNextPage,
    start,
    oldestLoaded,
    events.length,
    fetchNextPage,
    view.initialised,
  ])

  // --- view helpers ---
  const timeToX = (t: number) => (t - start) / msPerPx

  const zoomAt = useCallback(
    (factor: number, anchorX: number) => {
      onViewChange((v) => {
        const vEnd = v.follow ? end : v.end
        const vStart = vEnd - plotWidth * v.msPerPx
        const anchorTime = vStart + anchorX * v.msPerPx
        const next = clampScale(v.msPerPx * factor)
        const nextStart = anchorTime - anchorX * next
        // zooming while following keeps following when the anchor is at the live edge
        const follow = v.follow && anchorX > plotWidth * 0.8
        return { ...v, msPerPx: next, end: nextStart + plotWidth * next, follow }
      })
    },
    [onViewChange, end, plotWidth],
  )

  const panBy = useCallback(
    (px: number) =>
      onViewChange((v) => ({
        ...v,
        end: (v.follow ? end : v.end) + px * v.msPerPx,
        follow: false,
      })),
    [onViewChange, end],
  )

  const focusRange = useCallback(
    (from: number, to: number) => {
      const rangeSpan = Math.max(to - from, 1)
      const next = clampScale((rangeSpan * 2.5) / plotWidth)
      const center = (from + to) / 2
      onViewChange((v) => ({
        ...v,
        msPerPx: next,
        end: center + (plotWidth * next) / 2,
        follow: false,
      }))
      return next
    },
    [onViewChange, plotWidth],
  )

  const jumpToLatest = () => onViewChange((v) => ({ ...v, follow: true }))

  const jumpToEvents = () => {
    if (!events.length) return
    const reference = events[Math.min(49, events.length - 1)].createdAt
    const newest = events[0].createdAt
    onViewChange((v) => ({
      ...v,
      msPerPx: clampScale(Math.max(60_000, (newest - reference) * 1.3) / plotWidth),
      end: newest + (newest - reference) * 0.15 + 30_000,
      follow: false,
    }))
  }

  // --- keep the selected event visible (keyboard, table selection, panel resize) ---
  useEffect(() => {
    if (!selected || !view.initialised || width === 0) return
    const x = timeToX(selected.createdAt)
    if (x >= 16 && x <= plotWidth - 16) return
    onViewChange((v) => ({
      ...v,
      end: selected.createdAt + (plotWidth * v.msPerPx) / 2,
      follow: false,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, plotWidth])

  // --- wheel: vertical zooms around the cursor, horizontal pans ---
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left - GUTTER
      if (x < 0) return
      e.preventDefault()
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        panBy(e.shiftKey ? e.deltaY : e.deltaX)
      } else {
        // pinch gestures report ctrlKey with small deltas, scale them up
        const delta = e.ctrlKey ? e.deltaY * 4 : e.deltaY
        zoomAt(Math.exp(delta * 0.002), x)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [panBy, zoomAt])

  // --- click and drag panning ---
  const drag = useRef<{ x: number; end: number; moved: boolean; pointerId: number } | null>(null)
  const suppressClick = useRef(false)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return
    drag.current = { x: e.clientX, end, moved: false, pointerId: e.pointerId }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return
    if (!d.moved) {
      d.moved = true
      setIsDragging(true)
      setHover(null)
      containerRef.current?.setPointerCapture(d.pointerId)
    }
    onViewChange((v) => ({ ...v, end: d.end - dx * v.msPerPx, follow: false }))
  }

  const handlePointerUp = () => {
    if (drag.current?.moved) {
      suppressClick.current = true
      setTimeout(() => (suppressClick.current = false))
    }
    drag.current = null
    setIsDragging(false)
  }

  // --- selection ---
  const handleClusterClick = (cluster: Cluster) => {
    if (suppressClick.current) return
    containerRef.current?.focus({ preventScroll: true })
    if (cluster.events.length === 1) {
      onSelect(cluster.events[0].id)
      return
    }
    const first = cluster.events[0].createdAt
    const last = cluster.events[cluster.events.length - 1].createdAt
    // events too close to split apart: select the newest instead of zooming forever
    const nextScale = clampScale(((last - first) * 2.5) / plotWidth)
    if (nextScale >= msPerPx * 0.9 || msPerPx <= MIN_MS_PER_PX) {
      onSelect(cluster.events[cluster.events.length - 1].id)
      return
    }
    focusRange(first, last)
    setHover(null)
  }

  const selectNearestInLane = (laneIndex: number, time: number) => {
    const lane = lanes[laneIndex]
    if (!lane?.events.length) return
    const i = lowerBound(lane.events, time)
    const candidates = [lane.events[i - 1], lane.events[i]].filter(Boolean)
    const nearest = candidates.sort(
      (a, b) => Math.abs(a.createdAt - time) - Math.abs(b.createdAt - time),
    )[0]
    if (nearest) onSelect(nearest.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const centerTime = start + span / 2
    const index = selected ? indexById.get(selected.id) ?? -1 : -1
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault()
        if (e.shiftKey) {
          panBy((e.key === 'ArrowLeft' ? -1 : 1) * plotWidth * 0.25)
          return
        }
        if (index === -1) {
          // nothing selected yet: start from the event closest to the view centre
          const laneIndex = lanes.findIndex((l) => l.events.length)
          if (laneIndex !== -1) selectNearestInLane(laneIndex, centerTime)
          return
        }
        // events are sorted newest first
        const next = events[index + (e.key === 'ArrowLeft' ? 1 : -1)]
        if (next) onSelect(next.id)
        else if (e.key === 'ArrowLeft' && hasNextPage) fetchNextPage()
        return
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        if (!selected) return
        e.preventDefault()
        const laneIndex = lanes.findIndex((l) => l.id === selected.topic.split('.')[0])
        const target = laneIndex + (e.key === 'ArrowUp' ? -1 : 1)
        if (target >= 0 && target < lanes.length) selectNearestInLane(target, selected.createdAt)
        return
      }
      case '+':
      case '=':
        e.preventDefault()
        zoomAt(0.5, selected ? timeToX(selected.createdAt) : plotWidth / 2)
        return
      case '-':
      case '_':
        e.preventDefault()
        zoomAt(2, selected ? timeToX(selected.createdAt) : plotWidth / 2)
        return
      case 'End':
      case 'n':
        e.preventDefault()
        jumpToLatest()
        return
      case 'Escape':
        if (selected) {
          e.preventDefault()
          onSelect(null)
        }
        return
    }
  }

  // --- tooltip ---
  const showTooltip = (cluster: Cluster, e: React.MouseEvent) => {
    if (drag.current?.moved) return
    const rect = containerRef.current?.getBoundingClientRect()
    const target = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (!rect) return
    setHover({
      cluster,
      x: target.left - rect.left + target.width / 2,
      y: target.bottom - rect.top,
    })
  }

  const tooltipStyle = hover
    ? (() => {
        const height = containerRef.current?.clientHeight ?? 0
        const flipUp = hover.y > height - 150
        return {
          left: Math.min(Math.max(8, hover.x - 40), width - 348),
          ...(flipUp ? { bottom: height - hover.y + 26 } : { top: hover.y + 8 }),
        }
      })()
    : undefined

  const selectedSummary = selected
    ? `${selected.topic}, ${format(selected.createdAt, 'PPpp')}. ${selected.description}`
    : ''

  const overlayStyle = { left: GUTTER, right: 0, top: DAY_ROW_HEIGHT, bottom: 0 }
  const unloadedX = unloadedUntil !== null ? timeToX(unloadedUntil) : -1
  const nowX = timeToX(now)

  return (
    <Styled.Container
      ref={containerRef}
      className={clsx({ dragging: isDragging })}
      tabIndex={0}
      role="application"
      aria-roledescription="timeline"
      aria-label="Events timeline. Arrow keys move between events, plus and minus zoom, shift and arrows pan, N jumps to now."
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => setHover(null)}
    >
      {/* grid lines, behind the markers */}
      <Styled.Overlay style={overlayStyle} aria-hidden>
        {ticks.map((tick) => (
          <Styled.GridLine
            key={tick.time}
            className={clsx({ major: tick.major })}
            style={{ left: timeToX(tick.time) }}
          />
        ))}
      </Styled.Overlay>

      <Styled.DayRow aria-hidden>
        <Styled.GutterCell>
          <span className="label">{format(start, 'd MMM yyyy')}</span>
        </Styled.GutterCell>
        <Styled.Plot>
          {dayMarkers
            .filter((m) => m.time > start)
            .map((m) => (
              <Styled.DayLabel key={m.time} style={{ left: timeToX(m.time) }}>
                {m.label}
              </Styled.DayLabel>
            ))}
        </Styled.Plot>
      </Styled.DayRow>

      <Styled.Histogram aria-hidden>
        <Styled.GutterCell>
          <Icon icon="bar_chart" />
          <span className="label">In view</span>
          <span className="count">{visibleCount}</span>
        </Styled.GutterCell>
        <Styled.Plot>
          {histogram.map((bar) => (
            <Styled.Bar
              key={bar.time}
              title={`${bar.count} events${bar.errors ? `, ${bar.errors} errors` : ''}`}
              style={{
                left: bar.x + 0.5,
                width: Math.max(1, bar.width - 1),
                // sqrt keeps quiet periods visible next to bursts
                height: Math.max(2, Math.sqrt(bar.count / maxBar) * (HISTOGRAM_HEIGHT - 6)),
              }}
              onClick={() => !suppressClick.current && focusRange(bar.time, bar.time + bucket)}
            >
              {!!bar.errors && (
                <div className="errors" style={{ height: `${(bar.errors / bar.count) * 100}%` }} />
              )}
            </Styled.Bar>
          ))}
        </Styled.Plot>
      </Styled.Histogram>

      <Styled.Lanes>
        {lanes.map((lane, laneIndex) => {
          const meta = getCategoryMeta(lane.id)
          return (
            <Styled.Lane
              key={lane.id}
              className={clsx({ active: selected && selected.topic.split('.')[0] === lane.id })}
            >
              <Styled.GutterCell title={meta.label}>
                <Icon icon={meta.icon} style={{ color: meta.color }} />
                <span className="label">{meta.label}</span>
                <span className="count">{lane.events.length}</span>
              </Styled.GutterCell>
              <Styled.Plot>
                {clusters[laneIndex].map((cluster) => {
                  const isCluster = cluster.events.length > 1
                  const severity = getSeverityMeta(
                    cluster.severity === 'error' || cluster.severity === 'warning'
                      ? cluster.severity
                      : null,
                  )
                  const color = severity?.color ?? meta.color
                  const isSelected =
                    !!selected && cluster.events.some((ev) => ev.id === selected.id)
                  return (
                    <Styled.Marker
                      key={cluster.key}
                      className={clsx(cluster.severity, {
                        cluster: isCluster,
                        selected: isSelected,
                        active: cluster.hasActive,
                      })}
                      style={
                        {
                          left: cluster.x,
                          width: isCluster
                            ? getMarkerWidth(cluster.events.length, cluster.width)
                            : undefined,
                          '--marker-color': color,
                        } as React.CSSProperties
                      }
                      onClick={() => handleClusterClick(cluster)}
                      onMouseEnter={(e) => showTooltip(cluster, e)}
                      onMouseLeave={() => setHover(null)}
                      aria-hidden
                    >
                      {isCluster && cluster.events.length}
                    </Styled.Marker>
                  )
                })}
              </Styled.Plot>
            </Styled.Lane>
          )
        })}
      </Styled.Lanes>

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
        </Styled.Plot>
      </Styled.Axis>

      {/* overlays above the markers */}
      <Styled.Overlay style={{ ...overlayStyle, bottom: AXIS_HEIGHT, overflow: 'hidden' }}>
        {nowX >= 0 && nowX <= plotWidth && <Styled.NowLine style={{ left: nowX }} title="Now" />}
        {selected && <Styled.SelectedLine style={{ left: timeToX(selected.createdAt) }} />}
        {unloadedX > 0 && (
          <Styled.Unloaded
            style={{ width: Math.min(unloadedX, plotWidth) }}
            title={hasNextPage ? 'Older events not loaded yet' : 'Outside the date filter'}
          >
            {hasNextPage && unloadedX > 160 && (
              <Button
                variant="surface"
                icon={isFetchingNextPage ? 'progress_activity' : 'history'}
                label={isFetchingNextPage ? 'Loading…' : 'Load older'}
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              />
            )}
          </Styled.Unloaded>
        )}
      </Styled.Overlay>

      <Styled.Controls onPointerDown={(e) => e.stopPropagation()}>
        <Button
          icon="remove"
          variant="text"
          onClick={() => zoomAt(2, plotWidth / 2)}
          data-tooltip="Zoom out (-)"
          aria-label="Zoom out"
        />
        {ZOOM_PRESETS.map((preset) => (
          <button
            key={preset.label}
            className={clsx('preset', {
              active: Math.abs(span - preset.span) / preset.span < 0.05,
            })}
            onClick={() =>
              onViewChange((v) => {
                const next = clampScale(preset.span / plotWidth)
                const center = (v.follow ? end : v.end) - (plotWidth * v.msPerPx) / 2
                return v.follow
                  ? { ...v, msPerPx: next }
                  : { ...v, msPerPx: next, end: center + (plotWidth * next) / 2 }
              })
            }
            aria-label={`Show ${preset.label}`}
          >
            {preset.label}
          </button>
        ))}
        <Button
          icon="add"
          variant="text"
          onClick={() => zoomAt(0.5, plotWidth / 2)}
          data-tooltip="Zoom in (+)"
          aria-label="Zoom in"
        />
        <span className="span" aria-live="polite">
          {formatSpan(span)}
        </span>
        <Button
          icon={view.follow ? 'sensors' : 'skip_next'}
          label={view.follow ? 'Live' : 'Now'}
          variant={view.follow ? 'tonal' : 'text'}
          onClick={jumpToLatest}
          data-tooltip={
            view.follow ? 'Following new events' : 'Jump to now and follow new events (N)'
          }
        />
      </Styled.Controls>

      {events.length > 0 && visibleCount === 0 && !isFetchingNextPage && (
        <Styled.Hint>
          <span>No events in this time range</span>
          <Button variant="filled" label="Show latest events" onClick={jumpToEvents} />
        </Styled.Hint>
      )}

      {hover && (
        <Styled.Tooltip style={tooltipStyle} role="tooltip">
          <ClusterSummary cluster={hover.cluster} />
        </Styled.Tooltip>
      )}

      <Styled.SrOnly aria-live="polite">{selectedSummary}</Styled.SrOnly>
    </Styled.Container>
  )
}

const ClusterSummary: FC<{ cluster: Cluster }> = ({ cluster }) => {
  const { events } = cluster
  if (events.length === 1) {
    const event = events[0]
    const severity = getSeverityMeta(getSeverity(event))
    const status = getStatusMeta(event.status)
    return (
      <>
        <span className="title">
          {severity && <Icon icon={severity.icon} style={{ color: severity.color }} />}
          {event.topic}
        </span>
        {event.description && <span className="description">{event.description}</span>}
        <span className="meta">
          {format(event.createdAt, 'PP HH:mm:ss')} · {status.label}
          {event.user && ` · ${event.user}`}
          {event.project && ` · ${event.project}`}
        </span>
      </>
    )
  }

  const byTopic = new Map<string, number>()
  for (const e of events) byTopic.set(e.topic, (byTopic.get(e.topic) ?? 0) + 1)
  const top = [...byTopic.entries()].sort((a, b) => b[1] - a[1])
  const first = events[0].createdAt
  const last = events[events.length - 1].createdAt
  const sameDay = format(first, 'PP') === format(last, 'PP')

  return (
    <>
      <span className="title">{events.length} events</span>
      {top.slice(0, 4).map(([topic, count]) => (
        <span key={topic} className="meta">
          {count} × {topic}
        </span>
      ))}
      {top.length > 4 && <span className="meta">+{top.length - 4} more topics</span>}
      <span className="meta">
        {format(first, 'PP HH:mm:ss')} – {format(last, sameDay ? 'HH:mm:ss' : 'PP HH:mm:ss')}
      </span>
      <span className="hint">Click to zoom in</span>
    </>
  )
}
