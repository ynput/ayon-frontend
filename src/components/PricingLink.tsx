import { pricingUrl } from '@/constants'
import { forwardRef } from 'react'

interface PricingLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {}

export const PricingLink = forwardRef<HTMLAnchorElement, PricingLinkProps>(
  ({ children, ...props }, ref) => {
    return (
      <a href={pricingUrl} target="_blank" rel="noopener noreferrer" {...props} ref={ref}>
        {children}
      </a>
    )
  },
)
