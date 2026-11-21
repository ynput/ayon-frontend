import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { useInView } from 'react-intersection-observer'
import { Icon } from '@ynput/ayon-react-components'
import { useLocalStorage } from '@shared/hooks'
import {
  settingsHistoryApi,
  SettingsChange,
  SettingsChangePayload,
} from '@queries/settingsHistory/getSettingsHistory'
import {
  beforeSave,
  describeChange,
  describeListChange,
  filterDiffs,
  formatValue,
  getChangeDiffs,
  getPathTitles,
  groupSaves,
  OverrideDiff,
  startsVersion,
} from './settingsHistoryHelpers'
import type { HistoryLane } from './useSettingsHistory'
import { useChangeDiffs } from './useChangeDiffs'
import { useQueryEach } from './useQueryEach'
import { HoveredSaves, useHoveredSaves } from './hoveredSaves'
import { SaveAvatar } from './SettingsChangeList'
import { SettingName } from './SettingsDiff'
import * as Styled from './SettingsHistoryFeed.styled'

const MAX_CHANGES = 3
const MAX_TOOLTIP_CHANGES = 8
// saves checked at a time for the changes of one setting, each loads its payload
const SCAN_BATCH = 25

type Entry = { change: SettingsChange; previous?: SettingsChange; lane: HistoryLane }

/** The setting selected in the editor */
export type SelectedSetting = { addonName: string; path: string[] }

/** How a setting changed, for a tooltip, with room for the values */
const describeInFull = (diff: OverrideDiff) => {
  if (diff.sameValue) {
    return `override removed, it inherits the same value ${formatValue(diff.before, 80)}`
  }
  const note = describeListChange(diff.before, diff.after)
  const values = `${formatValue(diff.before, 80)} → ${formatValue(diff.after, 80)}`
  return note ? `${values} (${note})` : values
}

type ChangeProps = {
  diff: OverrideDiff
  schema?: any
  /** the setting the list is filtered to, its own name is left out */
  filterPath: string[] | null
}

/**
 * A setting a save changed. Only its name, the values are in its tooltip, unless the list shows
 * the history of this setting.
 */
const Change: FC<ChangeProps> = ({ diff, schema, filterPath }) => {
  const titles = getPathTitles(schema, diff.path)
  const names = (filterPath ? titles.slice(filterPath.length) : titles).slice(-2)
  return (
    <span
      className="change"
      data-tooltip={`${titles.join(' › ')}\n${describeInFull(diff)}`}
      data-tooltip-delay={300}
    >
      <SettingName titles={names} />
      {filterPath && (
        <span className="values">
          {describeListChange(diff.before, diff.after) ?? describeChange(diff, 40)}
        </span>
      )}
    </span>
  )
}

type SaveProps = {
  entry: Entry
  schema?: any
  /** the scrolling list, what changed loads shortly before a save scrolls into it */
  root: HTMLElement | null
  filterPath: string[] | null
  linked: boolean
  hoveredSaves: HoveredSaves
  onPick: (entry: Entry) => void
  /** the save changed nothing, it is left out of the list */
  onEmpty: (id: string) => void
}

/** One save: the settings it changed and when, clicking it compares from before it with now */
const Save: FC<SaveProps> = memo(function Save({
  entry,
  schema,
  root,
  filterPath,
  linked,
  hoveredSaves,
  onPick,
  onEmpty,
}) {
  const { ref, inView } = useInView({ root, rootMargin: '200px 0px', triggerOnce: true })
  const { change, previous } = entry
  const { diffs: allDiffs, startsVersion, isError } = useChangeDiffs(change, previous, !inView)
  const diffs = useMemo(
    () => (allDiffs && filterPath ? filterDiffs(allDiffs, filterPath) : allDiffs),
    [allDiffs, filterPath],
  )
  const empty = allDiffs?.length === 0
  // the first save of a version, with the settings of the version before
  const copied = empty && startsVersion
  const rest = diffs ? diffs.slice(MAX_CHANGES) : []

  useEffect(() => {
    if (empty && !copied) onEmpty(change.id)
  }, [empty, copied, change.id, onEmpty])

  if (empty && !copied) return null
  return (
    <Styled.Save
      ref={ref}
      className={clsx({ linked, copied })}
      aria-disabled={copied || undefined}
      tabIndex={copied ? -1 : undefined}
      onClick={copied ? undefined : () => onPick(entry)}
      onMouseEnter={() => hoveredSaves.set([change.id])}
      onMouseLeave={() => hoveredSaves.set(null)}
    >
      <span className="lines">
        {copied ? (
          <span className="status">Copied from {previous?.addonVersion}</span>
        ) : !diffs ? (
          <span className="status">{isError ? 'Could not load what changed' : ' '}</span>
        ) : (
          diffs
            .slice(0, MAX_CHANGES)
            .map((diff) => (
              <Change
                key={diff.path.join('/')}
                diff={diff}
                schema={schema}
                filterPath={filterPath}
              />
            ))
        )}
        {!!rest.length && (
          <span
            className="status"
            data-tooltip={[
              ...rest
                .slice(0, MAX_TOOLTIP_CHANGES)
                .map((diff) => getPathTitles(schema, diff.path).slice(-2).join(' › ')),
              ...(rest.length > MAX_TOOLTIP_CHANGES
                ? [`and ${rest.length - MAX_TOOLTIP_CHANGES} more`]
                : []),
            ].join('\n')}
            data-tooltip-delay={300}
          >
            + {rest.length} more
          </span>
        )}
      </span>
      <span className="time">{format(change.createdAt, 'HH:mm')}</span>
      {!copied && <span className="action">Compare with now</span>}
    </Styled.Save>
  )
})

/**
 * The saves among `candidates` (newest first) that changed a setting. Checks the first `limit`,
 * `checked` counts the saves from the top whose changes are known.
 */
const useSavesChanging = (candidates: Entry[], path: string[] | null, limit: number) => {
  const checking = useMemo(
    () => (path ? candidates.slice(0, limit) : []),
    [candidates, path, limit],
  )
  const args = useMemo(
    () =>
      [
        ...new Set(
          checking.flatMap(({ change, previous }) =>
            previous && startsVersion(change, previous) ? [change.id, previous.id] : [change.id],
          ),
        ),
      ].map((id) => ({ id })),
    [checking],
  )
  const payloads = useQueryEach<{ id: string }, SettingsChangePayload | null>(
    settingsHistoryApi.endpoints.getSettingsChangePayload,
    args,
  )

  return useMemo(() => {
    const byId = new Map(args.map((arg, i) => [arg.id, payloads[i]]))
    const isDone = (id?: string) => {
      const state = id ? byId.get(id) : undefined
      return !!state && (state.isSuccess || state.isError)
    }
    const matches: Entry[] = []
    let checked = 0
    for (const entry of checking) {
      const { change, previous } = entry
      const starts = startsVersion(change, previous)
      if (!isDone(change.id) || (starts && !isDone(previous?.id))) break
      const payload = byId.get(change.id)?.data
      const previousPayload = starts ? byId.get(previous?.id as string)?.data : undefined
      const diffs = payload ? getChangeDiffs(payload, previousPayload, starts) : null
      if (path && diffs && filterDiffs(diffs, path).length) matches.push(entry)
      checked++
    }
    return { matches, checked }
  }, [args, payloads, checking, path])
}

type Props = {
  lanes: HistoryLane[]
  schemas: Record<string, any>
  isLoading?: boolean
  /** kept mounted while hidden, so the list keeps its scroll position */
  hidden?: boolean
  /** the list can show the history of this setting only */
  selectedSetting: SelectedSetting | null
  hoveredSaves: HoveredSaves
  onCompare: (time: number) => void
}

/** Every save of the selected addons, newest first, shown when there are no unsaved changes */
export const SettingsHistoryFeed: FC<Props> = ({
  lanes,
  schemas,
  isLoading,
  hidden,
  selectedSetting,
  hoveredSaves,
  onCompare,
}) => {
  const [listEl, setListEl] = useState<HTMLDivElement | null>(null)
  const [filterOn, setFilterOn] = useLocalStorage('settings-history-filter', true)
  // saves that changed nothing, known once their payload loaded
  const [emptyIds, setEmptyIds] = useState<ReadonlySet<string>>(new Set())
  const hoveredIds = useHoveredSaves(hoveredSaves)
  const hovered = useMemo(() => new Set(hoveredIds ?? []), [hoveredIds])

  // the selection is a new object on every click, the filter only changes with the setting
  const filterKey =
    filterOn && selectedSetting
      ? JSON.stringify([selectedSetting.addonName, selectedSetting.path])
      : null
  const filter = useMemo<SelectedSetting | null>(() => {
    if (!filterKey) return null
    const [addonName, path] = JSON.parse(filterKey)
    return { addonName, path }
  }, [filterKey])
  const [scan, setScan] = useState({ key: filterKey, limit: SCAN_BATCH })
  const limit = scan.key === filterKey ? scan.limit : SCAN_BATCH

  useEffect(() => {
    if (listEl) listEl.scrollTop = 0
  }, [filterKey, listEl])

  const pick = useCallback(
    (entry: Entry) => {
      hoveredSaves.set(null)
      onCompare(beforeSave(entry.change))
    },
    [hoveredSaves, onCompare],
  )
  const markEmpty = useCallback(
    (id: string) => setEmptyIds((ids) => (ids.has(id) ? ids : new Set(ids).add(id))),
    [],
  )

  const entries = useMemo(
    () =>
      lanes
        .flatMap((lane) =>
          lane.changes.map((change, i) => ({ change, previous: lane.changes[i - 1], lane })),
        )
        .sort((a, b) => b.change.createdAt - a.change.createdAt),
    [lanes],
  )
  const candidates = useMemo(
    () => (filter ? entries.filter((entry) => entry.lane.addonName === filter.addonName) : []),
    [entries, filter],
  )
  const { matches, checked } = useSavesChanging(candidates, filter?.path ?? null, limit)
  const days = useMemo(() => {
    const shown = (filter ? matches : entries).filter(({ change }) => !emptyIds.has(change.id))
    // the version shows where it changes, the runs below it are in the same version
    const versions = new Map<string, string>()
    return groupSaves(shown).map((day) => ({
      ...day,
      runs: day.runs.map((saves) => {
        const { addonName, addonVersion } = saves[0].change
        const showVersion = versions.get(addonName) !== addonVersion
        versions.set(addonName, addonVersion)
        return { saves, showVersion }
      }),
    }))
  }, [filter, matches, entries, emptyIds])
  const scanning = !!filter && checked < candidates.length

  const { ref: scanRef, inView: scanInView } = useInView({ root: listEl, rootMargin: '200px 0px' })
  useEffect(() => {
    if (scanning && scanInView && checked >= limit) {
      setScan({ key: filterKey, limit: limit + SCAN_BATCH })
    }
  }, [scanning, scanInView, checked, limit, filterKey])

  const latest = entries[0]?.change
  const truncated = lanes.some((lane) => lane.truncated)
  const showAddon = lanes.length > 1
  const selectedTitles = selectedSetting
    ? getPathTitles(schemas[selectedSetting.addonName], selectedSetting.path)
    : []

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
      {selectedSetting && (
        <Styled.FilterBar
          className={clsx({ active: !!filter })}
          onClick={() => setFilterOn(!filterOn)}
          data-tooltip={`${selectedTitles.join(' › ')}\n${
            filter
              ? 'Click to show the history of all settings'
              : 'Click to show the history of this setting only'
          }`}
        >
          <Icon icon={filter ? 'filter_alt' : 'filter_alt_off'} />
          {!filter && <span className="hint">Show only</span>}
          <SettingName titles={selectedTitles.slice(-1)} />
        </Styled.FilterBar>
      )}
      <Styled.List ref={setListEl}>
        {days.map((day) => (
          <section key={day.label}>
            <Styled.Day>{day.label}</Styled.Day>
            {day.runs.map(({ saves, showVersion }) => {
              const { change, lane } = saves[0]
              return (
                <Styled.Run key={change.id}>
                  <span className="who">
                    <SaveAvatar user={change.user} size={20} />
                    <span className="user">{change.user || 'Unknown user'}</span>
                    <span className="addon">
                      {showAddon && (
                        <>
                          <span className="swatch" style={{ backgroundColor: lane.color }} />
                          {lane.title}
                        </>
                      )}{' '}
                      {showVersion && change.addonVersion}
                    </span>
                  </span>
                  <span className="saves">
                    {saves.map((entry) => (
                      <Save
                        key={entry.change.id}
                        entry={entry}
                        schema={schemas[entry.lane.addonName]}
                        root={listEl}
                        filterPath={filter?.path ?? null}
                        linked={hovered.has(entry.change.id)}
                        hoveredSaves={hoveredSaves}
                        onPick={pick}
                        onEmpty={markEmpty}
                      />
                    ))}
                  </span>
                </Styled.Run>
              )
            })}
          </section>
        ))}
        {scanning ? (
          <Styled.Footer ref={scanRef}>
            Looking for changes, {checked} of {candidates.length} saves checked
          </Styled.Footer>
        ) : (
          <>
            {filter && !matches.length && (
              <Styled.Footer>No saved changes to {selectedTitles.slice(-1)[0]}</Styled.Footer>
            )}
            {truncated && <Styled.Footer>Older saves were not loaded</Styled.Footer>}
          </>
        )}
      </Styled.List>
    </Styled.Panel>
  )
}
