import { forwardRef } from 'react'
import { ActiveSegment } from './EntityPath.styled'
import { classNames } from 'primereact/utils'
import { PathSegment } from './EntityPath'
import { Icon } from '@ynput/ayon-react-components'

interface SegmentWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  segment?: PathSegment
}

export const SegmentWrapper = forwardRef<HTMLDivElement, SegmentWrapperProps>(
  ({ children, segment, ...props }, ref) => {
    // is the segment NOT a product?
    const isLinkable = segment?.type !== 'product'

    return (
      <ActiveSegment className={classNames({ link: isLinkable })} {...props} ref={ref}>
        {children}
      </ActiveSegment>
    )
  },
)
