import { forwardRef, MouseEvent } from 'react'
import { ActiveSegment } from './EntityPath.styled'
import { classNames } from 'primereact/utils'
import { PathSegment } from './EntityPath'
import { useDispatch } from 'react-redux'
import { openSlideOut } from '@state/details'
import useCreateContext from '@hooks/useCreateContext'
import copyToClipboard from '@helpers/copyToClipboard'

interface SegmentProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  segment?: PathSegment
  isOpen?: boolean
  scope: string
  projectName: string
}

const SegmentProvider = forwardRef<HTMLDivElement, SegmentProviderProps>(
  ({ children, segment, isOpen, scope, projectName, ...props }, ref) => {
    const dispatch = useDispatch()
    // is the segment NOT a product || project?
    const isLinkable = segment?.type !== 'product' && segment?.type !== 'project'

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

    const buildContextMenu = (id: string) => [
      {
        label: `ID: ${id}`,
        icon: 'content_copy',
        command: () => copyToClipboard(id),
      },
    ]

    const [contextMenuShow] = useCreateContext()

    const handleOnContext = (e: MouseEvent<HTMLDivElement>) => {
      if (!segment) return
      const menu = buildContextMenu(segment.id)

      contextMenuShow(e, menu)
    }

    return (
      <ActiveSegment
        onClick={handleClick}
        onContextMenu={handleOnContext}
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
