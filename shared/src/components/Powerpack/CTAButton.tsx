import { forwardRef } from 'react'
import { MoreButton } from './PowerpackDialog.styled'

interface CTAButtonProps extends React.HTMLAttributes<HTMLButtonElement> {}

export const CTAButton = forwardRef<HTMLButtonElement, CTAButtonProps>(({ ...props }, ref) => {
  return <MoreButton {...props}>Try for free!</MoreButton>
})
