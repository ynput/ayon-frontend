import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './BundleStatus.styled'

type Props = {
  statuses: string[]
}

const STATUS_LABELS: Record<string, string> = {
  production: 'Used in the production bundle',
  staging: 'Used in the staging bundle',
  dev: 'Used in a dev bundle',
  active: 'Used in a bundle',
  error: 'Failed to load, check the server logs',
}

const StatusMark = ({ status, tooltip }: { status: string; tooltip?: string }) =>
  // an icon, so a broken addon doesn't read as another bundle colour
  status === 'error' ? (
    <Icon icon="error" className="error" data-tooltip={tooltip} data-tooltip-delay={0} />
  ) : (
    <span
      className="dot"
      style={{ backgroundColor: `var(--color-hl-${status}, var(--md-sys-color-outline))` }}
      data-tooltip={tooltip}
      data-tooltip-delay={0}
    />
  )

const BundleStatus = ({ statuses = [] }: Props) => {
  if (!statuses?.length) return null
  return (
    <Styled.StatusDots className="status-dots">
      {statuses.map((status) => (
        <StatusMark key={status} status={status} tooltip={STATUS_LABELS[status] || status} />
      ))}
    </Styled.StatusDots>
  )
}

const LEGEND: [string, string][] = [
  ['production', 'Production'],
  ['staging', 'Staging'],
  ['dev', 'Dev'],
  ['active', 'Other bundle'],
  ['error', 'Failed to load'],
]

// the key to the status column
export const BundleStatusLegend = () => (
  <Styled.Legend>
    {LEGEND.map(([status, label]) => (
      <span key={status} className="legend-item" data-tooltip={STATUS_LABELS[status]}>
        <StatusMark status={status} />
        {label}
      </span>
    ))}
  </Styled.Legend>
)

export default BundleStatus
