import * as Styled from './DetailsPanelSlideOut.styled'
import { useDispatch, useSelector } from 'react-redux'
import DetailsPanel from '../DetailsPanel'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { closeSlideOut } from '@state/details'

const DetailsPanelSlideOut = ({ projectsInfo, scope }) => {
  const dispatch = useDispatch()
  const slideOut = useSelector((state) => state.details.slideOut[scope])
  const { entityType, entityId, projectName } = slideOut || {}
  const isSlideOutOpen = !!entityType && !!entityId && !!projectName

  const { data: users } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName] || {}
  const { statuses = [], tags = [] } = projectInfo

  if (!isSlideOutOpen) return null

  const handleClose = () => dispatch(closeSlideOut())

  return (
    <Styled.SlideOut>
      <DetailsPanel
        entityType={entityType}
        entities={[{ id: entityId, projectName }]}
        projectsInfo={{ [projectName]: projectInfo }}
        projectNames={[projectName]}
        statusesOptions={statuses}
        tagsOptions={tags}
        projectUsers={users}
        activeProjectUsers={users}
        isSlideOut
        scope={scope}
        onClose={handleClose}
      />
    </Styled.SlideOut>
  )
}

export default DetailsPanelSlideOut
