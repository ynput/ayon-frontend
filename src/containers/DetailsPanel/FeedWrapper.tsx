import { Feed, ActivityReferenceTooltip, FeedProvider } from '@shared/containers/Feed'
import type { EditingState } from '@shared/containers/Feed'

import { FC, useState } from 'react'
import { Status } from '@api/rest/project'
import { useViewer } from '@context/viewerContext'
import { useDetailsPanelContext } from '@shared/context'

interface FeedWrapperProps {
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
  isMultiProjects: boolean
  readOnly: boolean
  statuses: Status[]
  scope: string
}

// handles all redux states and dispatching
// forwards any props
const FeedWrapper: FC<FeedWrapperProps> = ({
  scope = 'dashboard',
  entities,
  entityType,
  projectName,
  projectInfo,
  ...props
}) => {
  // listen to the viewer for annotations
  // later on, other hooks can be tried here to get annotations from different sources
  const { useAnnotations } = useViewer()
  const { annotations, removeAnnotation, exportAnnotationComposite } = useAnnotations()

  const annotationsProps = { annotations, removeAnnotation, exportAnnotationComposite }

  const { onOpenImage, onGoToFrame, onOpenViewer, user } = useDetailsPanelContext()

  const userName = user.name || ''
  const userFullName = user.attrib?.fullName || ''

  const handlerProps = {
    onOpenImage,
    onGoToFrame,
    onOpenViewer,
  }

  const [editingId, setEditingId] = useState<EditingState>(null)

  return (
    <FeedProvider
      {...{
        scope,
        entities,
        projectName,
        entityType,
        projectInfo,
        userName,
        userFullName,
      }}
      {...handlerProps}
      {...annotationsProps}
      {...{ editingId, setEditingId }}
    >
      <Feed {...props} />
      <ActivityReferenceTooltip />
    </FeedProvider>
  )
}

export default FeedWrapper
