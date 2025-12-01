// mainly just a wrapper for data fetching

import { DetailsPanel } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { DetailsPanelSlideOut } from '@shared/containers'
import { useGetProjectsInfoQuery } from '@shared/api'
import { ViewerDetailsPanelWrapper } from './Viewer.styled'
import { useViewer } from '@context/ViewerContext'

type Props = {
  versionIds: string[]
  projectName: string | null
  noVersions?: boolean
}

const ViewerDetailsPanel = ({ versionIds = [], projectName, noVersions }: Props) => {
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: projectName ? [projectName] : [] },
    { skip: !projectName },
  )

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const entities = versionIds.map((id) => ({ id, projectName, entityType: 'version' }))

  // listen to the viewer for annotations
  // later on, other hooks can be tried here to get annotations from different sources
  const { useAnnotations } = useViewer()
  const { annotations, removeAnnotation, exportAnnotationComposite } = useAnnotations()

  if (!projectName) return null

  const projectInfo = projectsInfo[projectName]

  return (
    <ViewerDetailsPanelWrapper
      className="viewer-details-panel"
      style={{ display: noVersions ? 'none' : 'block' }}
    >
      {!!versionIds.length && (
        <DetailsPanel
          isOpen
          entities={entities}
          tagsOptions={projectInfo?.tags || []}
          projectUsers={users}
          activeProjectUsers={users}
          disabledProjectUsers={[]}
          projectsInfo={projectsInfo}
          projectNames={[projectName]}
          entityType={'version'}
          scope="review"
          style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
          annotations={annotations}
          removeAnnotation={removeAnnotation}
          exportAnnotationComposite={exportAnnotationComposite}
        />
      )}
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="review" />
    </ViewerDetailsPanelWrapper>
  )
}

export default ViewerDetailsPanel
