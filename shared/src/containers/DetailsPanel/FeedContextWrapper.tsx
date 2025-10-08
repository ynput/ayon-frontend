import { FC, useState, ReactNode } from 'react'

import { FeedProvider } from '@shared/containers/Feed'
import type { EditingState, FeedContextProps } from '@shared/containers/Feed'
import type { Status } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'

interface FeedContextWrapperProps {
  children: ReactNode
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
  isMultiProjects: boolean
  readOnly: boolean
  statuses: Status[]
  scope?: string
  annotations?: any
  removeAnnotation?: (id: string) => void
  exportAnnotationComposite?: (id: string) => Promise<Blob | null>
}

const FeedContextWrapper: FC<FeedContextWrapperProps> = ({
  children,
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

  const userName = user?.name ?? ''
  const userFullName = user?.attrib?.fullName ?? ''

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
      {children}
    </FeedProvider>
  )
}

export default FeedContextWrapper
