import { FC } from 'react'
import { format, formatDistanceToNowStrict } from 'date-fns'
import { SaveAvatar } from '@containers/AddonSettings/SettingsHistory/SettingsChangeList'
import { DATE_FORMAT } from '@containers/AddonSettings/SettingsHistory/settingsHistoryHelpers'
import { AddonChange, BundleChange, BundleLane, describeAddonChange } from './bundleHistoryHelpers'

const MAX_ADDONS = 5

const AddonValues: FC<{ addon: AddonChange }> = ({ addon }) => (
  <span className="values">
    <span className="note">{addon.name}</span>
    {addon.before && <span className="before">{addon.before}</span>}
    {addon.before && addon.after && <span className="arrow">→</span>}
    {addon.after && <span className="after">{addon.after}</span>}
    {!addon.before && <span className="note">added</span>}
    {!addon.after && <span className="note">removed</span>}
  </span>
)

const AddonChanges: FC<{ change: BundleChange }> = ({ change }) => {
  if (change.created) return <span className="meta">Created</span>
  if (!change.addons) return <span className="meta">Addons changed</span>
  return (
    <>
      {change.addons.slice(0, MAX_ADDONS).map((addon) => (
        <AddonValues key={addon.name} addon={addon} />
      ))}
      {change.addons.length > MAX_ADDONS && (
        <span className="meta">+ {change.addons.length - MAX_ADDONS} more</span>
      )}
    </>
  )
}

/** The bundle a variant was set to, and the one that held it before */
const VariantValues: FC<{ lane: BundleLane; change: BundleChange }> = ({ lane, change }) => {
  const before = lane.changes[lane.changes.indexOf(change) - 1]?.value
  return (
    <span className="values">
      {before && <span className="before">{before}</span>}
      {before && <span className="arrow">→</span>}
      <span className="after">{change.value ?? 'none'}</span>
    </span>
  )
}

type SummaryProps = { lane: BundleLane; change: BundleChange; canOpen: boolean }

/** Tooltip of one change: who, when and what changed */
export const BundleChangeSummary: FC<SummaryProps> = ({ lane, change, canOpen }) => (
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
      {lane.title}
    </span>
    <div className="diffs">
      {lane.variant ? (
        <VariantValues lane={lane} change={change} />
      ) : (
        <AddonChanges change={change} />
      )}
    </div>
    {lane.variant && canOpen && <span className="hint">Click to open {change.bundleName}</span>}
  </>
)

/** What a change did, short: the addon or how many, and the version or bundle it set */
const describeShort = (lane: BundleLane, change: BundleChange) => {
  if (lane.variant) return { what: '', value: change.value ?? 'none' }
  if (change.created) return { what: 'created', value: '' }
  const addons = change.addons ?? []
  if (addons.length === 1) return { what: addons[0].name, value: addons[0].after ?? 'removed' }
  return { what: addons.length ? `${addons.length} addons` : 'addons', value: '' }
}

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
        <span className="swatch" style={{ backgroundColor: lane.color }} />
        {lane.title} · {changes.length} changes
      </span>
      <ul className="changes">
        {newestFirst.map((change, i) => {
          const showUser = newestFirst[i - 1]?.user !== change.user
          const { what, value } = describeShort(lane, change)
          return (
            <li key={change.id}>
              <button
                className="change"
                onClick={() => onPick(change)}
                data-tooltip={change.addons?.map(describeAddonChange).join('\n') || undefined}
              >
                {showUser ? <SaveAvatar user={change.user} size={20} /> : <span />}
                <span className="user">{showUser ? change.user || 'Unknown user' : ''}</span>
                <span className="count">{what}</span>
                <span className="date">{format(change.createdAt, DATE_FORMAT)}</span>
                <span className="version">{value}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
