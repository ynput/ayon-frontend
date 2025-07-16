import { FC, useState } from 'react'

import { Feed, ActivityReferenceTooltip, FeedProvider } from '@shared/containers/Feed'
import type { EditingState } from '@shared/containers/Feed'
import type { Status } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'
import { ProjectContextProvider } from '@shared/context/ProjectContext'

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
  annotations?: any
  removeAnnotation?: (id: string) => void
  exportAnnotationComposite?: (id: string) => Promise<Blob | null>
}

// forwards any props
const FeedWrapper: FC<FeedWrapperProps> = ({
  scope = 'dashboard',
  entities,
  entityType,
  projectName,
  projectInfo,
  annotations,
  removeAnnotation,
  exportAnnotationComposite,
  ...props
}) => {
  const annotationsProps = { annotations, removeAnnotation, exportAnnotationComposite }

  const { user } = useDetailsPanelContext()

  const userName = user.name || ''
  const userFullName = user.attrib?.fullName || ''

  const [editingId, setEditingId] = useState<EditingState>(null)

  return (
    <ProjectContextProvider projectName={projectName}>
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
        {...annotationsProps}
        {...{ editingId, setEditingId }}
      >
        <Feed {...props} />
        <ActivityReferenceTooltip />
      </FeedProvider>
    </ProjectContextProvider>
  )
}

export default FeedWrapper
