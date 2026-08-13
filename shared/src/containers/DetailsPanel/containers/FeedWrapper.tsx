import { FC } from 'react'

import { Feed } from '@shared/containers/Feed/Feed'
import ActivityReferenceTooltip from '@shared/containers/Feed/components/ActivityReferenceTooltip/ActivityReferenceTooltip'
import { FeedProvider } from '@shared/containers/Feed/context/FeedContext'
import type { Status, QueryFilter } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context/DetailsPanelContext'
import { useLocalStorage } from '@shared/hooks/useLocalStorage'

interface FeedWrapperProps {
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
  thumbnailHash?: string // thumbnailHash from entity
  disabled: boolean
  readOnly: boolean
  isSlideOut?: boolean
  statuses: Status[]
  scope: string
  entityListId?: string
  annotations?: any
  removeAnnotation?: (id: string) => void
  exportAnnotationComposite?: (id: string) => Promise<Blob | null>
}

// forwards any props
const FeedWrapper: FC<FeedWrapperProps> = ({
  scope = 'dashboard',
  entities,
  entityType,
  thumbnailHash,
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
      {...props}
    >
      <Feed {...props} statuses={props.statuses} />
      <ActivityReferenceTooltip />
    </FeedProvider>
  )
}

export default FeedWrapper
