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

const BundleStatus = ({ statuses = [] }: Props) => {
  if (!statuses?.length) return null
  return (
    <Styled.StatusDots className="status-dots">
      {statuses.map((status) =>
        // an icon, so a broken addon doesn't read as another bundle colour
        status === 'error' ? (
          <Icon
            key={status}
            icon="error"
            className="error"
            data-tooltip={STATUS_LABELS.error}
            data-tooltip-delay={0}
          />
        ) : (
          <span
            key={status}
            className="dot"
            style={{
              backgroundColor: `var(--color-hl-${status}, var(--md-sys-color-outline))`,
            }}
            data-tooltip={STATUS_LABELS[status] || status}
            data-tooltip-delay={0}
          />
        ),
      )}
    </Styled.StatusDots>
  )
}

export default BundleStatus
