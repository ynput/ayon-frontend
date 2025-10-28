// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import useFocusedEntities from '@hooks/useFocused'
import { useAppDispatch, useAppSelector } from '@state/store'
import { openViewer, ViewerState } from '@state/viewer'
// shared
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery, useGetProjectsInfoQuery, ProjectModel, DetailsPanelEntityType } from '@shared/api'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'

interface FocusedEntity {
  id: string
  projectName: string
}

interface UseFocusedEntitiesReturn {
  entities: FocusedEntity[]
  entityType: DetailsPanelEntityType
  subTypes: string[]
}

const BrowserDetailsPanel = () => {
  const projectName = useAppSelector((state) => state.project.name) as unknown as string

  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: Partial<ViewerState>) => dispatch(openViewer(args))

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })
  const projectInfo = projectsInfo[projectName]

  const { entities, entityType, subTypes }: UseFocusedEntitiesReturn = useFocusedEntities(projectName)

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  if (!entities.length) return null

  return (
    <EntityListsContextBoundary projectName={projectName}>
      {(entityListsContext) => (
        <>
          <DetailsPanel
            entitySubTypes={subTypes}
            entityType={entityType}
            entities={entities}
            projectsInfo={projectsInfo as Record<string, ProjectModel>}
            projectNames={[projectName]}
            tagsOptions={projectInfo?.tags || []}
            projectUsers={users}
            activeProjectUsers={users}
            style={{ boxShadow: 'none' }}
            scope="project"
            onOpenViewer={handleOpenViewer}
            entityListsContext={entityListsContext}
          />
          <DetailsPanelSlideOut
            projectsInfo={projectsInfo as Record<string, ProjectModel>}
            scope="project"
            entityListsContext={entityListsContext}
          />
        </>
      )}
    </EntityListsContextBoundary>
  )
}

export default BrowserDetailsPanel
