// mainly just a wrapper for data fetching

import { useMemo } from 'react'
import { DetailsPanel } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { DetailsPanelSlideOut } from '@shared/containers'
import { useGetProjectsInfoQuery } from '@shared/api'
import { ViewerDetailsPanelWrapper } from './Viewer.styled'
import { useViewer } from '@context'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'
import { useDetailsPanelContext } from '@shared/context'
import { DetailsPanelContext } from '@shared/context'

type Props = {
  versionIds: string[]
  projectName: string | null
  noVersions?: boolean
  hidden?: boolean
}

const ViewerDetailsPanel = ({ versionIds = [], projectName, noVersions, hidden }: Props) => {
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: projectName ? [projectName] : [] },
    { skip: !projectName },
  )

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const entities = versionIds.map((id) => ({ id, projectName, entityType: 'version' }))

  // listen to the viewer for annotations
  // later on, other hooks can be tried here to get annotations from different sources
  const { useAnnotations, commentFrameLink, feedFrameLinks, setFeedFrameLinks } = useViewer()
  const { annotations, removeAnnotation, exportAnnotationComposite } = useAnnotations()

  // the viewer's feed links comments to frames of the viewer's player
  const detailsPanelContext = useDetailsPanelContext()
  const viewerDetailsPanelContext = useMemo(
    () => ({ ...detailsPanelContext, commentFrameLink, feedFrameLinks, setFeedFrameLinks }),
    [detailsPanelContext, commentFrameLink, feedFrameLinks, setFeedFrameLinks],
  )

  if (!projectName) return null

  const projectInfo = projectsInfo[projectName]

  return (
    <EntityListsContextBoundary projectName={projectName}>
      {(entityListsContext) => (
        <ViewerDetailsPanelWrapper
          className="viewer-details-panel"
          style={{ display: noVersions || hidden ? 'none' : 'block' }}
        >
          {!!versionIds.length && (
            <DetailsPanelContext.Provider value={viewerDetailsPanelContext}>
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
                entityListsContext={entityListsContext}
                annotations={annotations}
                removeAnnotation={removeAnnotation}
                exportAnnotationComposite={exportAnnotationComposite}
              />
            </DetailsPanelContext.Provider>
          )}
          <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="review" />
        </ViewerDetailsPanelWrapper>
      )}
    </EntityListsContextBoundary>
  )
}

export default ViewerDetailsPanel
