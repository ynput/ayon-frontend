import * as Styled from './UserDashboardSlideOut.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onSlideOutClose } from '/src/features/dashboard'
import UserDashboardDetails from '../UserDashboardDetails/UserDashboardDetails'

const UserDashboardSlideOut = ({ projectsInfo }) => {
  const dispatch = useDispatch()
  const slideOut = useSelector((state) => state.dashboard.slideOut)

  const { entityType, entityId, projectName } = slideOut

  if (!entityType || !entityId || !projectName) return null

  const handleClose = () => {
    dispatch(onSlideOutClose())
  }

  return (
    <Styled.SlideOut>
      <UserDashboardDetails
        entityType={entityType}
        entityIds={[entityId]}
        projectInfo={projectsInfo[projectName]}
        projectName={projectName}
        onClose={handleClose}
      />
    </Styled.SlideOut>
  )
}

export default UserDashboardSlideOut
