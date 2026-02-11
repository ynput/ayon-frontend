import { FC } from 'react'

import { Feed, ActivityReferenceTooltip, FeedProvider } from '@shared/containers/Feed'
import type { Status, QueryFilter } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'
import { useLocalStorage } from '@shared/hooks'

interface FeedWrapperProps {
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
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

  const [feedFilter, setFeedFilter] = useLocalStorage<QueryFilter>(`feed-filters-${scope}`, {
    operator: 'and',
    conditions: [],
  })

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
        feedFilter,
        setFeedFilter,
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
