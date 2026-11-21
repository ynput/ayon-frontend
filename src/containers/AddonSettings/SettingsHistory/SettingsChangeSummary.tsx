import { FC } from 'react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import type { SettingsChange } from '@queries/settingsHistory/getSettingsHistory'
import { DATE_FORMAT, getPathTitles } from './settingsHistoryHelpers'
import { useChangeDiffs } from './useChangeDiffs'
import type { HistoryLane } from './useSettingsHistory'
import { DiffPath, DiffValues } from './SettingsDiff'
import { SaveAvatar } from './SettingsChangeList'

const MAX_DIFFS = 5

type Props = {
  change: SettingsChange
  /** change saved just before this one, for this addon */
  previous?: SettingsChange
  lane: HistoryLane
  schema?: any
}

/** Tooltip content of one change: who, when, which version and what changed */
export const SettingsChangeSummary: FC<Props> = ({ change, previous, lane, schema }) => {
  const { diffs, startsVersion, isError } = useChangeDiffs(change, previous)
  const isOtherVersion = change.addonVersion !== lane.current

  return (
    <>
      <span className="who">
        <SaveAvatar user={change.user} size={22} />
        {change.user || 'Unknown user'}
      </span>
      <span className="meta">
        {format(change.createdAt, DATE_FORMAT)} ·{' '}
        {formatDistanceToNowStrict(change.createdAt, { addSuffix: true })}
      </span>
      <span className="meta version">
        <span className="swatch" style={{ backgroundColor: lane.color }} />
        {lane.title} {change.addonVersion}
        {isOtherVersion && ' (older version)'}
      </span>
      <div className="diffs">
        {!diffs ? (
          <span className="meta">
            {isError ? 'Could not load what changed' : 'Loading changes…'}
          </span>
        ) : (
          <>
            <span className="meta">
              {startsVersion &&
                `First save of ${change.addonVersion}, compared to ${previous?.addonVersion}: `}
              {diffs.length
                ? `${diffs.length} setting${diffs.length === 1 ? '' : 's'} changed`
                : 'no setting changed'}
            </span>
            {diffs.slice(0, MAX_DIFFS).map((diff) => (
              <div className="diff" key={diff.path.join('/')}>
                <DiffPath titles={getPathTitles(schema, diff.path)} />
                <DiffValues diff={diff} />
              </div>
            ))}
            {diffs.length > MAX_DIFFS && (
              <span className="meta">+ {diffs.length - MAX_DIFFS} more</span>
            )}
          </>
        )}
      </div>
      <span className="hint">Click to compare with now</span>
    </>
  )
}
