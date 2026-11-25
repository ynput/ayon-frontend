// The details panel for one entity as a preview (DetailsPanel isPreview): what matters most about it,
// and the page left alone. For a panel next to search results, e.g. an addon's.
import { useGetProjectsInfoQuery, useGetUsersAssigneeQuery } from '@shared/api'
import { useDetailsPanelContext } from '@shared/context'
import { DetailsPanel } from '../../DetailsPanel'
import type { DetailsPanelProps } from '../../DetailsPanel'
import type { DetailsPanelEntityType } from '@shared/api'

export type DetailsPanelPreviewProps = {
  projectName: string
  entityType: DetailsPanelEntityType
  entityId: string
  /** keeps the selected tab, apart from the page's panels */
  scope?: string
  style?: React.CSSProperties
  className?: string
}

export const DetailsPanelPreview = ({
  projectName,
  entityType,
  entityId,
  scope = 'preview',
  style,
  className,
}: DetailsPanelPreviewProps) => {
  const { onOpenViewer } = useDetailsPanelContext()
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })
  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const projectInfo = projectsInfo[projectName]

  return (
    <div style={style} className={className}>
      <DetailsPanel
        isOpen
        entityType={entityType}
        entities={[{ id: entityId, projectName }]}
        projectsInfo={projectsInfo as DetailsPanelProps['projectsInfo']}
        projectNames={[projectName]}
        tagsOptions={projectInfo?.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        scope={scope}
        onOpenViewer={(args) => onOpenViewer?.(args)}
        isPreview
      />
    </div>
  )
}
