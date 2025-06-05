import { forwardRef } from 'react'
export const pricingUrl = 'https://ynput.io/ayon/pricing?utm_source=ayon'

export interface PricingLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {}

export const PricingLink = forwardRef<HTMLAnchorElement, PricingLinkProps>(
  ({ children, ...props }, ref) => {
    return (
      <a href={pricingUrl} target="_blank" rel="noopener noreferrer" {...props} ref={ref}>
        {children}
      </a>
    )
  },
)
