import * as Styled from './DetailsPanelSlideOut.styled'
import { useAppDispatch } from '@state/store'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import DetailsPanel from '../DetailsPanel'
import { openViewer } from '@state/viewer'
import { useDetailsPanelContext } from '@shared/context'
import { ProjectModel } from '@api/rest/project'

type DetailsPanelSlideOutProps = {
  projectsInfo: Record<string, ProjectModel>
  scope: string
}

const DetailsPanelSlideOut = ({ projectsInfo, scope }: DetailsPanelSlideOutProps) => {
  const dispatch = useAppDispatch()
  const { slideOut } = useDetailsPanelContext()
  const { entityType, entityId, projectName } = slideOut || {}
  const isSlideOutOpen = !!entityType && !!entityId && !!projectName

  const { data: users } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName || ''] || {}
  const { tags = [] } = projectInfo

  const { closeSlideOut } = useDetailsPanelContext()
  const handleClose = () => closeSlideOut()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))

  if (!isSlideOutOpen) return null
  return (
    <Styled.SlideOut>
      <DetailsPanel
        entityType={entityType}
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

export default DetailsPanelSlideOut
