import { forwardRef } from 'react'
import { ActiveSegment } from './EntityPath.styled'
import { classNames } from 'primereact/utils'
import { PathSegment } from './EntityPath'
import { useDispatch } from 'react-redux'
import { openSlideOut } from '@state/details'

interface SegmentProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  segment?: PathSegment
  isOpen?: boolean
  scope: string
  projectName: string
}

const SegmentProvider = forwardRef<HTMLDivElement, SegmentProviderProps>(
  ({ children, segment, isOpen, scope, projectName, ...props }, ref) => {
    const dispatch = useDispatch()
    // is the segment NOT a product?
    const isLinkable = segment?.type !== 'product'

    const handleClick = () => {
      if (!isLinkable) return

      const { type: entityType, id: entityId } = segment || {}

      dispatch(
        openSlideOut({
          scope,
          entityType,
          entityId,
          projectName,
        }),
      )
    }

    return (
      <ActiveSegment
        onClick={handleClick}
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
