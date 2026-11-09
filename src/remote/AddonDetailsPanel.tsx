import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import type { DetailsPanelEntityType } from '@shared/api'
import { useProjectContext } from '@shared/context'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'

export interface AddonDetailsPanelProps {
  projectName: string
  entityType: DetailsPanelEntityType
  entityIds: string[]
  onClose: () => void
}

// AYON's details panel for an addon page that sets `detailsPanel: true` (`openDetails` in
// @ynput/ayon-addon). Addon tabs and menu items are in it like in the built-in pages' panels.
export const AddonDetailsPanel = ({
  projectName,
  entityType,
  entityIds,
  onClose,
}: AddonDetailsPanelProps) => {
  const dispatch = useAppDispatch()
  const projectInfo = useProjectContext()
  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })
  const projectsInfo = { [projectName]: projectInfo }

  return (
    <EntityListsContextBoundary projectName={projectName}>
      {(entityListsContext) => (
        <>
          <DetailsPanel
            isOpen
            entityType={entityType}
            entities={entityIds.map((id) => ({ id, projectName }))}
            projectsInfo={projectsInfo}
            projectNames={[projectName]}
            tagsOptions={projectInfo.tags || []}
            projectUsers={users}
            activeProjectUsers={users}
            style={{ boxShadow: 'none' }}
            scope="addon"
            entityListsContext={entityListsContext}
            onClose={onClose}
            onOpenViewer={(args: any) => dispatch(openViewer(args))}
          />
          <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="addon" />
        </>
      )}
    </EntityListsContextBoundary>
  )
}
