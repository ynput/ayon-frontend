import * as Styled from './UserDashboardSlideOut.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onSlideOutClose } from '/src/features/dashboard'
import UserDashboardDetails from '../UserDashboardDetails/UserDashboardDetails'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import Shortcuts from '/src/containers/Shortcuts'
import { useEffect, useState } from 'react'
import { classNames } from 'primereact/utils'

const UserDashboardSlideOut = ({ projectsInfo }) => {
  const dispatch = useDispatch()
  const slideOut = useSelector((state) => state.dashboard.slideOut)
  const { entityType, entityId, projectName } = slideOut
  const isSlideOutOpen = entityType && entityId && projectName

  const [previouslyOpen, setPreviouslyOpen] = useState(false)
  const [slideOutShown, setSlideOutShown] = useState(false)

  useEffect(() => {
    let slideTimeOut
    if (isSlideOutOpen) {
      if (!previouslyOpen) {
        // show slide out when opening new one
        setPreviouslyOpen(true)
        setSlideOutShown(true)
      } else {
        // hide slide out when loading new one
        setSlideOutShown(false)
        // then show slide out when new one is loaded
        slideTimeOut = setTimeout(() => setSlideOutShown(true), 500)
      }
    }

    return () => {
      slideTimeOut && clearTimeout(slideTimeOut)
      setSlideOutShown(false)
    }
  }, [isSlideOutOpen, entityId])

  const { data: users } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName] || {}
  const { statuses = [], tags = [] } = projectInfo

  if (!isSlideOutOpen) return null

  const handleClose = () => {
    dispatch(onSlideOutClose())
  }

  return (
    <Styled.SlideOut className={classNames({ slideOutShown })}>
      <UserDashboardDetails
        entityType={entityType}
        entityIds={[entityId]}
        projectInfo={projectInfo}
        projectName={projectName}
        onClose={handleClose}
        statusesOptions={statuses}
        tagsOptions={tags}
        projectUsers={users}
        activeProjectUsers={users}
        isSlideOut
      />
      <Shortcuts shortcuts={[{ key: 'Escape', action: handleClose }]} deps={[]} />
    </Styled.SlideOut>
  )
}

export default UserDashboardSlideOut
