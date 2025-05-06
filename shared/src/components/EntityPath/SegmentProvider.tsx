import { forwardRef, MouseEvent } from 'react'
import { ActiveSegment } from './EntityPath.styled'
import { classNames } from 'primereact/utils'
import { PathSegment } from './EntityPath'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { copyToClipboard } from '@shared/util'
import { useDetailsPanelContext } from '@shared/context'

interface SegmentProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  segment?: PathSegment
  isOpen?: boolean
  scope: string
  projectName: string
}

const SegmentProvider = forwardRef<HTMLDivElement, SegmentProviderProps>(
  ({ children, segment, isOpen, scope, projectName, ...props }, ref) => {
    const { openSlideOut } = useDetailsPanelContext()
    // is the segment NOT a product || project?
    const isLinkable = segment?.type !== 'product' && segment?.type !== 'project'

    const handleClick = () => {
      if (!isLinkable) return

      const { type: entityType, id: entityId } = segment || {}

      if (!entityType || entityType === 'project' || entityType === 'product' || !entityId) return

      openSlideOut({
        entityType,
        entityId,
        projectName,
      })
    }

    const buildContextMenu = (id: string) => [
      {
        label: `ID: ${id}`,
        icon: 'content_copy',
        command: () => copyToClipboard(id),
      },
    ]

    const [contextMenuShow] = useCreateContextMenu()

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
