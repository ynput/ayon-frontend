import { FC } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import { describeListChange, formatValue, OverrideDiff } from './settingsHistoryHelpers'

/** `Parent › Parent › Setting` with the setting itself emphasised */
export const DiffPath: FC<{ titles: string[]; className?: string }> = ({ titles, className }) => (
  <span className={className ?? 'path'} title={titles.join(' › ')}>
    {titles.slice(0, -1).map((title, i) => (
      <span key={i}>{title} › </span>
    ))}
    <b>{titles[titles.length - 1]}</b>
  </span>
)

type DiffValuesProps = {
  diff: OverrideDiff
  className?: string
  /** lists only say what happened to them, where both values do not fit */
  compact?: boolean
}

/** Old and new value of a setting, `default` when it was not overridden */
export const DiffValues: FC<DiffValuesProps> = ({ diff, className, compact }) => {
  if (diff.sameValue) {
    return (
      <span
        className={className ?? 'values'}
        title={`Overridden with ${formatValue(diff.before)}, the same value as it inherits now`}
      >
        <span className="note">override removed</span>
      </span>
    )
  }
  const note = describeListChange(diff.before, diff.after)
  if (compact && note) {
    return (
      <span className={className ?? 'values'}>
        <span className="note">{note}</span>
      </span>
    )
  }
  return (
    <span className={className ?? 'values'}>
      <span className="before">{formatValue(diff.before)}</span>
      <Icon icon="arrow_forward" />
      <span className="after">{formatValue(diff.after)}</span>
      {note && <span className="note">({note})</span>}
    </span>
  )
}
