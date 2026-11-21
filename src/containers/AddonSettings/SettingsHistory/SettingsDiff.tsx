import { FC } from 'react'
import clsx from 'clsx'
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

/** `Parent › Setting` on one line, the parent gives way first, styled by `settingName` */
export const SettingName: FC<{ titles: string[] }> = ({ titles }) =>
  titles.length ? (
    <span className="name">
      {titles.length > 1 && <span className="parent">{titles.slice(0, -1).join(' › ')}</span>}
      <span className="leaf">{titles[titles.length - 1]}</span>
    </span>
  ) : null

/** What a list change or a removed override means, where the values alone do not tell */
export const describeNote = (diff: OverrideDiff) =>
  diff.sameValue ? 'override removed' : describeListChange(diff.before, diff.after)

/** Old and new value of a setting, `default` when it was not overridden */
export const DiffValues: FC<{ diff: OverrideDiff; className?: string }> = ({ diff, className }) => {
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
  return (
    <span className={className ?? 'values'}>
      <span className="before">{formatValue(diff.before)}</span>
      <span className="arrow">→</span>
      <span className="after">{formatValue(diff.after)}</span>
      {note && <span className="note">({note})</span>}
    </span>
  )
}

/**
 * The value then and now side by side, like a split diff, `default` when not overridden.
 * A setting the current version does not have no longer exists now.
 */
export const SplitDiff: FC<{ diff: OverrideDiff }> = ({ diff }) => (
  <span className="diff">
    <span className={clsx('then', { inherited: diff.before === undefined })}>
      {formatValue(diff.before, 160)}
    </span>
    <span className="arrow">→</span>
    {diff.missing ? (
      <span className="now missing">no longer exists</span>
    ) : (
      <span className={clsx('now', { inherited: diff.after === undefined })}>
        {formatValue(diff.after, 160)}
      </span>
    )}
  </span>
)
