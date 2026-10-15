import { useMemo } from 'react'
import { ProjectPageRemote } from '@shared/components'
import type {
  ProjectPageRemoteProps,
  RemotePageDetailsPanelProps,
  RemoteViewer,
} from '@shared/components'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { useProjectContext } from '@shared/context'
import { EntityListsContextBoundary } from '@pages/ProjectListsPage/context'
import { useAppDispatch, useAppSelector } from '@state/store'
import { closeViewer, openViewer } from '@state/viewer'

const RemotePageDetailsPanel = ({ projectName, entities, onClose }: RemotePageDetailsPanelProps) => {
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
            entityType={entities.entityType}
            entities={entities.entityIds.map((id) => ({ id, projectName }))}
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

interface ProjectRemotePageProps extends Omit<ProjectPageRemoteProps, 'DetailsPanel' | 'viewer'> {
  detailsPanel?: boolean
}

// An addon project page with the host's viewer, and its details panel when the page uses it.
// The viewer state lives here, not in ProjectPage, so opening the viewer only re-renders the addon page.
export const ProjectRemotePage = ({ detailsPanel, ...props }: ProjectRemotePageProps) => {
  const dispatch = useAppDispatch()
  const isViewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const viewer = useMemo<RemoteViewer>(
    () => ({
      isOpen: isViewerOpen,
      open: (target) => dispatch(openViewer(target)),
      close: () => dispatch(closeViewer()),
    }),
    [isViewerOpen, dispatch],
  )

  return (
    <ProjectPageRemote
      {...props}
      viewer={viewer}
      DetailsPanel={detailsPanel ? RemotePageDetailsPanel : undefined}
    />
  )
}
