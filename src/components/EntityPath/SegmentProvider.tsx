import { forwardRef } from 'react'
import { ActiveSegment } from './EntityPath.styled'
import { classNames } from 'primereact/utils'
import { PathSegment } from './EntityPath'

interface SegmentProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  segment?: PathSegment
  isOpen?: boolean
}

const SegmentProvider = forwardRef<HTMLDivElement, SegmentProviderProps>(
  ({ children, segment, isOpen, ...props }, ref) => {
    // is the segment NOT a product?
    const isLinkable = segment?.type !== 'product'

    return (
      <ActiveSegment
        className={classNames({ link: isLinkable, open: isOpen })}
        {...props}
        ref={ref}
      >
        {children}
      </ActiveSegment>
    )
  },
)

export default SegmentProvider
