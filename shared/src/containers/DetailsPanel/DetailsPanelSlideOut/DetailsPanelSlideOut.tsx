import * as Styled from './DetailsPanelSlideOut.styled'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { DetailsPanel } from '../DetailsPanel'
import { useDetailsPanelContext } from '@shared/context'
import type { ProjectModel } from '@shared/api'
import { EntityListsContextType } from '../../../../../src/pages/ProjectListsPage/context'

export type DetailsPanelSlideOutProps = {
  projectsInfo: Record<string, ProjectModel>
  scope: string
  entityListsContext?: EntityListsContextType
}

export const DetailsPanelSlideOut = ({
  projectsInfo,
  scope,
  entityListsContext,
}: DetailsPanelSlideOutProps) => {
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
        entityListsContext={entityListsContext}
      />
    </Styled.SlideOut>
  )
}
