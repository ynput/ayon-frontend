import { FC } from 'react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { UserImage as InitialsImage } from '@ynput/ayon-react-components'
import { UserImage } from '@shared/components'
import type { SettingsChange } from '@queries/settingsHistory/getSettingsHistory'
import type { HistoryLane } from './useSettingsHistory'
import { beforeSave } from './settingsHistoryHelpers'
import { useChangeDiffs } from './useChangeDiffs'

/** Avatar of who saved, the events of some services have no user */
export const SaveAvatar: FC<{ user: string | null; size: number; className?: string }> = ({
  user,
  size,
  className,
}) =>
  user ? (
    <UserImage name={user} size={size} className={className} />
  ) : (
    <InitialsImage name="?" size={size} className={className} />
  )

/** How many settings a save changed */
const ChangeCount: FC<{ change: SettingsChange; previous?: SettingsChange }> = ({
  change,
  previous,
}) => {
  const { diffs } = useChangeDiffs(change, previous)
  if (!diffs) return <span className="count" />
  if (!diffs.length) return <span className="count">no changes</span>
  return (
    <span className="count">
      {diffs.length} change{diffs.length === 1 ? '' : 's'}
    </span>
  )
}

type Props = {
  lane: HistoryLane
  /** ascending, listed newest first */
  changes: SettingsChange[]
  compareAt: number | null
  onPick: (change: SettingsChange) => void
}

/** Saves too close together on the timeline to point at, to pick one from */
export const SettingsChangeList: FC<Props> = ({ lane, changes, compareAt, onPick }) => (
  <>
    <span className="list-title">
      <span className="swatch" style={{ backgroundColor: lane.color }} />
      {lane.title} · {changes.length} saves
    </span>
    <ul className="changes">
      {[...changes].reverse().map((change) => (
        <li key={change.id}>
          <button
            className={clsx('change', { selected: beforeSave(change) === compareAt })}
            onClick={() => onPick(change)}
          >
            <SaveAvatar user={change.user} size={20} />
            <span className="user">{change.user || 'Unknown user'}</span>
            <ChangeCount
              change={change}
              previous={lane.changes[lane.changes.indexOf(change) - 1]}
            />
            <span className="date">{format(change.createdAt, 'd MMM yyyy, HH:mm')}</span>
            <span
              className={clsx('version', { older: change.addonVersion !== lane.currentVersion })}
            >
              {change.addonVersion}
            </span>
          </button>
        </li>
      ))}
    </ul>
  </>
)
