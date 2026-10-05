import * as Styled from './DetailsPanelSlideOut.styled'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { DetailsPanel } from '../../DetailsPanel'
import { useDetailsPanelContext } from '@shared/context'
import type { ProjectModel } from '@shared/api'

export type DetailsPanelSlideOutProps = {
  projectsInfo: Record<string, ProjectModel>
  scope: string
}

export const DetailsPanelSlideOut = ({ projectsInfo, scope }: DetailsPanelSlideOutProps) => {
  const { slideOut, onOpenViewer } = useDetailsPanelContext()
  const { entityType, entityId, projectName } = slideOut || {}
  const isSlideOutOpen = !!entityType && !!entityId && !!projectName

  const { data: users } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName || ''] || {}
  const { tags = [] } = projectInfo

  const { closeSlideOut } = useDetailsPanelContext()
  const handleClose = () => closeSlideOut()
  const handleOpenViewer = (args: any) => onOpenViewer?.(args)

  if (!isSlideOutOpen) return null
  return (
    <Styled.SlideOut>
      <DetailsPanel
        isOpen
        entityType={entityType}
        entitySubTypes={[]}
        entities={[{ id: entityId, projectName }]}
        projectsInfo={{ [projectName]: projectInfo }}
        projectNames={[projectName]}
        tagsOptions={tags}
        projectUsers={users}
        activeProjectUsers={users}
        isSlideOut
        scope={scope}
        onClose={handleClose}
        onOpenViewer={handleOpenViewer}
      />
    </Styled.SlideOut>
  )
}
