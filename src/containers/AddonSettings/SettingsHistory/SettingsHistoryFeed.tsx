import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { useInView } from 'react-intersection-observer'
import { Icon } from '@ynput/ayon-react-components'
import type { SettingsChange } from '@queries/settingsHistory/getSettingsHistory'
import { beforeSave, getDayLabel, getPathTitles } from './settingsHistoryHelpers'
import type { HistoryLane } from './useSettingsHistory'
import { useChangeDiffs } from './useChangeDiffs'
import { HoveredSaves, useHoveredSaves } from './hoveredSaves'
import { DiffValues } from './SettingsDiff'
import { SaveAvatar } from './SettingsChangeList'
import * as Styled from './SettingsHistoryFeed.styled'

const MAX_CHANGES = 3

type Entry = { change: SettingsChange; previous?: SettingsChange; lane: HistoryLane }

type EntryProps = {
  entry: Entry
  schema?: any
  /** the scrolling list, what changed loads shortly before an entry scrolls into it */
  root: HTMLElement | null
  selected: boolean
  linked: boolean
  hoveredSaves: HoveredSaves
  onPick: (entry: Entry) => void
}

/** One save: who, which addon, when and the settings it changed, one line each */
const FeedEntry: FC<EntryProps> = memo(function FeedEntry({
  entry,
  schema,
  root,
  selected,
  linked,
  hoveredSaves,
  onPick,
}) {
  const { ref, inView } = useInView({ root, rootMargin: '200px 0px', triggerOnce: true })
  const { change, previous, lane } = entry
  const { diffs, isError } = useChangeDiffs(change, previous, !inView)
  const empty = diffs?.length === 0

  return (
    <Styled.Entry
      ref={ref}
      className={clsx({ selected, linked, empty })}
      aria-disabled={empty || undefined}
      onClick={empty ? undefined : () => onPick(entry)}
      onMouseEnter={() => hoveredSaves.set([change.id])}
      onMouseLeave={() => hoveredSaves.set(null)}
    >
      <SaveAvatar user={change.user} size={20} className="avatar" />
      <span className="head">
        <span className="user">{change.user || 'Unknown user'}</span>
        <span className="addon">
          <span className="swatch" style={{ backgroundColor: lane.color }} />
          {lane.title} {change.addonVersion}
        </span>
        {empty && <span className="none">no changes</span>}
        <span className="time">{format(change.createdAt, 'HH:mm')}</span>
      </span>
      {!empty && (
        <span className="changes">
          {!diffs ? (
            <span className="status">{isError ? 'Could not load what changed' : ' '}</span>
          ) : (
            diffs.slice(0, MAX_CHANGES).map((diff) => {
              const titles = getPathTitles(schema, diff.path)
              return (
                <span key={diff.path.join('/')} className="change" title={titles.join(' › ')}>
                  <span className="name">
                    {titles.length > 1 && (
                      <span className="parent">{titles[titles.length - 2]}</span>
                    )}
                    <span className="leaf">{titles[titles.length - 1]}</span>
                  </span>
                  <DiffValues diff={diff} compact />
                </span>
              )
            })
          )}
          {!!diffs && diffs.length > MAX_CHANGES && (
            <span className="status">+ {diffs.length - MAX_CHANGES} more</span>
          )}
        </span>
      )}
    </Styled.Entry>
  )
})

type Props = {
  lanes: HistoryLane[]
  schemas: Record<string, any>
  isLoading?: boolean
  /** kept mounted while hidden, so the list keeps its scroll position */
  hidden?: boolean
  compareAt: number | null
  hoveredSaves: HoveredSaves
  onCompare: (time: number) => void
}

/** Every save of the selected addons, newest first, shown when there are no unsaved changes */
export const SettingsHistoryFeed: FC<Props> = ({
  lanes,
  schemas,
  isLoading,
  hidden,
  compareAt,
  hoveredSaves,
  onCompare,
}) => {
  const [listEl, setListEl] = useState<HTMLDivElement | null>(null)
  // the save compared last from here, marked when coming back to the list
  const [selected, setSelected] = useState<{ id: string; at: number } | null>(null)
  const hoveredIds = useHoveredSaves(hoveredSaves)
  const hovered = useMemo(() => new Set(hoveredIds ?? []), [hoveredIds])

  useEffect(() => {
    if (compareAt !== null && selected && compareAt !== selected.at) setSelected(null)
  }, [compareAt, selected])

  const pick = useCallback(
    (entry: Entry) => {
      const at = beforeSave(entry.change)
      setSelected({ id: entry.change.id, at })
      hoveredSaves.set(null)
      onCompare(at)
    },
    [hoveredSaves, onCompare],
  )

  const days = useMemo(() => {
    const entries: Entry[] = lanes
      .flatMap((lane) =>
        lane.changes.map((change, i) => ({ change, previous: lane.changes[i - 1], lane })),
      )
      .sort((a, b) => b.change.createdAt - a.change.createdAt)
    const groups: { label: string; entries: Entry[] }[] = []
    for (const entry of entries) {
      const label = getDayLabel(entry.change.createdAt)
      const last = groups[groups.length - 1]
      if (last?.label === label) last.entries.push(entry)
      else groups.push({ label, entries: [entry] })
    }
    return groups
  }, [lanes])

  const latest = days[0]?.entries[0]?.change
  const truncated = lanes.some((lane) => lane.truncated)

  return (
    <Styled.Panel style={hidden ? { display: 'none' } : undefined}>
      <Styled.Header>
        <Icon icon="history" />
        <span className="label">
          History
          <small>
            {isLoading
              ? 'Loading…'
              : latest
              ? `Last saved ${formatDistanceToNowStrict(latest.createdAt, { addSuffix: true })}${
                  latest.user ? ` by ${latest.user}` : ''
                }`
              : 'No saved changes yet'}
          </small>
        </span>
      </Styled.Header>
      <Styled.List ref={setListEl}>
        {days.map((day) => (
          <section key={day.label}>
            <Styled.Day>{day.label}</Styled.Day>
            {day.entries.map((entry) => (
              <FeedEntry
                key={entry.change.id}
                entry={entry}
                schema={schemas[entry.lane.addonName]}
                root={listEl}
                selected={entry.change.id === selected?.id}
                linked={hovered.has(entry.change.id)}
                hoveredSaves={hoveredSaves}
                onPick={pick}
              />
            ))}
          </section>
        ))}
        {truncated && <Styled.Footer>Older saves were not loaded</Styled.Footer>}
      </Styled.List>
    </Styled.Panel>
  )
}
