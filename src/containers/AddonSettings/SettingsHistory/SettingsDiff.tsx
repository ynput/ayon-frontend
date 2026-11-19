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

/** Old and new value of a setting, `default` when it was not overridden */
export const DiffValues: FC<{ diff: OverrideDiff; className?: string }> = ({ diff, className }) => {
  const note = diff.sameValue ? 'same value' : describeListChange(diff.before, diff.after)
  return (
    <span className={className ?? 'values'}>
      <span className="before">{formatValue(diff.before)}</span>
      <Icon icon="arrow_forward" />
      <span className="after">{formatValue(diff.after)}</span>
      {note && <span className="note">({note})</span>}
    </span>
  )
}
