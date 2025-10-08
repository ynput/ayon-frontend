import { FC, useState } from 'react'

import { Feed, ActivityReferenceTooltip, FeedProvider } from '@shared/containers/Feed'
import type { EditingState, FeedContextProps } from '@shared/containers/Feed'
import type { Status } from '@shared/api'
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
  annotations?: any
  license?: boolean
  onPowerFeature?: FeedContextProps['onPowerFeature']
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
      {...props}
    >
      <Feed {...props} />
      <ActivityReferenceTooltip />
    </FeedProvider>
  )
}

export default FeedWrapper
