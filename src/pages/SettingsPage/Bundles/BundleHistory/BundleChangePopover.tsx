import { FC } from 'react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { SaveAvatar } from '@containers/AddonSettings/SettingsHistory/SettingsChangeList'
import { DATE_FORMAT } from '@containers/AddonSettings/SettingsHistory/settingsHistoryHelpers'
import {
  AddonChange,
  BundleChange,
  BundleLane,
  describeAddonChange,
  describeChange,
} from './bundleHistoryHelpers'

const MAX_ADDONS = 5

const Arrow = () => <span className="arrow">→</span>

/** `core 1.2.0 → 1.3.0`, the old version muted */
const AddonLine: FC<{ addon: AddonChange }> = ({ addon: { name, before, after } }) => (
  <span className="change-text">
    <span>{name}</span>
    {before && after ? (
      <>
        <span className="from">{before}</span>
        <Arrow />
        <span>{after}</span>
      </>
    ) : after ? (
      <>
        <span className="note">added</span>
        <span>{after}</span>
      </>
    ) : (
      <span className="from">removed {before}</span>
    )}
  </span>
)

/** What a change did in a line, from what to what */
const ChangeLine: FC<{ change: BundleChange }> = ({ change }) => {
  if (change.source.variant) {
    return (
      <span className="change-text">
        {change.from && (
          <>
            <span className="from">{change.from}</span>
            <Arrow />
          </>
        )}
        <span>{change.to ?? 'none'}</span>
      </span>
    )
  }
  if (change.addons?.length === 1) return <AddonLine addon={change.addons[0]} />
  return <span className="change-text from">{describeChange(change)}</span>
}

const AddonChanges: FC<{ change: BundleChange }> = ({ change }) => {
  if (change.created) return <span className="meta">Created</span>
  if (!change.addons) return <span className="meta">Addons changed</span>
  return (
    <>
      {change.addons.slice(0, MAX_ADDONS).map((addon) => (
        <AddonLine key={addon.name} addon={addon} />
      ))}
      {change.addons.length > MAX_ADDONS && (
        <span className="meta">+ {change.addons.length - MAX_ADDONS} more</span>
      )}
    </>
  )
}

type SummaryProps = { change: BundleChange; canOpen: boolean }

/** Tooltip of one change: who, when and from what to what */
export const BundleChangeSummary: FC<SummaryProps> = ({ change, canOpen }) => (
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
      <span className="swatch" style={{ backgroundColor: change.source.color }} />
      {change.source.title}
    </span>
    <div className="diffs">
      {change.source.variant ? <ChangeLine change={change} /> : <AddonChanges change={change} />}
    </div>
    {canOpen && <span className="hint">Click to open {change.bundleName}</span>}
  </>
)

/** Plain text tooltip of a change in a list */
const getTooltip = (change: BundleChange) =>
  [
    change.source.title,
    ...(change.addons?.length ? change.addons.map(describeAddonChange) : [describeChange(change)]),
  ].join('\n')

type ListProps = {
  lane: BundleLane
  /** ascending, listed newest first */
  changes: BundleChange[]
  onPick: (change: BundleChange) => void
}

/** Changes too close together on the timeline to point at, who made them shown once per run */
export const BundleChangeList: FC<ListProps> = ({ lane, changes, onPick }) => {
  const newestFirst = [...changes].reverse()
  return (
    <>
      <span className="list-title">
        {lane.title} · {changes.length} changes
      </span>
      <ul className="changes">
        {newestFirst.map((change, i) => (
          <li key={change.id}>
            {newestFirst[i - 1]?.user !== change.user && (
              <span className="run-user">
                <SaveAvatar user={change.user} size={20} />
                {change.user || 'Unknown user'}
              </span>
            )}
            <button
              className="change text-row"
              onClick={() => onPick(change)}
              data-tooltip={getTooltip(change)}
            >
              <span className="swatch" style={{ backgroundColor: change.source.color }} />
              <ChangeLine change={change} />
              <span className="date">{format(change.createdAt, DATE_FORMAT)}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
