// mainly just a wrapper for data fetching

import { DetailsPanel } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { DetailsPanelSlideOut } from '@shared/containers'
import { useGetProjectsInfoQuery } from '@shared/api'
import { ViewerDetailsPanelWrapper } from './Viewer.styled'
import { useViewer } from '@context/ViewerContext'
import { VersionUploadProvider, UploadVersionDialog } from '@shared/components'
import { useAppDispatch } from '@state/store'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'

type Props = {
  versionIds: string[]
  projectName: string | null
}

const ViewerDetailsPanel = ({ versionIds = [], projectName }: Props) => {
  const dispatch = useAppDispatch()
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    { projects: projectName ? [projectName] : [] },
    { skip: !projectName },
  )

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  // listen to the viewer for annotations
  // later on, other hooks can be tried here to get annotations from different sources
  const { useAnnotations } = useViewer()
  const { annotations, removeAnnotation, exportAnnotationComposite } = useAnnotations()

  if (!projectName) return null

  const nonNullProjectName = projectName as string
  const projectInfo = (projectsInfo as any)[nonNullProjectName]

  // Try to get the lists context to enable "Add to list" in more menu
  let entityListsContext: Record<string, unknown> | undefined = undefined
  try {
    entityListsContext = useEntityListsContext() as unknown as Record<string, unknown>
  } catch (_error) {
    // context not available outside provider; leave undefined
  }

  return (
    <ViewerDetailsPanelWrapper>
      <VersionUploadProvider
        projectName={projectName}
        dispatch={dispatch}
        onVersionCreated={() => {}}
     >
        {!!versionIds.length && (
          <DetailsPanel
            entities={versionIds.map((id) => ({ id, projectName: nonNullProjectName })) as any}
            tagsOptions={projectInfo?.tags || []}
            projectUsers={users}
            activeProjectUsers={users}
            disabledProjectUsers={[]}
            projectsInfo={projectsInfo as any}
            projectNames={[nonNullProjectName] as any}
            entityType={'version'}
            scope="review"
            style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
            annotations={annotations}
            removeAnnotation={removeAnnotation}
            exportAnnotationComposite={exportAnnotationComposite}
            entityListsContext={entityListsContext}
          />
        )}
        <DetailsPanelSlideOut projectsInfo={projectsInfo as any} scope="review" />
        <UploadVersionDialog />
      </VersionUploadProvider>
    </ViewerDetailsPanelWrapper>
  )
}

export default ViewerDetailsPanel
