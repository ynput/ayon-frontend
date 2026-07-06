import { forwardRef } from 'react'
import { useFreeTrialLink } from './useFreeTrialLink'

// When there is something to subscribe to, send them to free trial page
// If they have already used their trial, they will be redirected to subscribe dialog
export interface FreeTrialLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  addon?: string
}

export const FreeTrialLink = forwardRef<HTMLAnchorElement, FreeTrialLinkProps>(
  ({ children, addon, ...props }, ref) => {
    const url = useFreeTrialLink({ addon })
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" {...props} ref={ref}>
        {children}
      </a>
    )
  },
)
