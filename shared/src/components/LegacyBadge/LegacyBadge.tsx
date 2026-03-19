import { Icon } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'

interface LegacyBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tooltip?: string
}

export const LegacyBadge = forwardRef<HTMLSpanElement, LegacyBadgeProps>(
  ({ tooltip = 'This page will deprecated in a future version', ...props }, ref) => {
    return <Icon icon={'ad_off'} data-tooltip={tooltip} {...props} ref={ref} />
  },
)
