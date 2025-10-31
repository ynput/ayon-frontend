import { FC } from 'react'

import { Feed, ActivityReferenceTooltip, FeedProvider } from '@shared/containers/Feed'
import type { Status } from '@shared/api'
import { useDetailsPanelContext, DetailsPanelTab } from '@shared/context'

interface FeedWrapperProps {
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
  disabled: boolean
  readOnly: boolean
  statuses: Status[]
  scope: string
  entityListId?: string
  annotations?: any
  removeAnnotation?: (id: string) => void
  exportAnnotationComposite?: (id: string) => Promise<Blob | null>
  currentTab: DetailsPanelTab
  setCurrentTab: (tab: DetailsPanelTab) => void
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
  currentTab,
  setCurrentTab,
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
      {...{ currentTab, setCurrentTab }}
      {...props}
    >
      <Feed {...props} />
      <ActivityReferenceTooltip />
    </FeedProvider>
  )
}

export default FeedWrapper
