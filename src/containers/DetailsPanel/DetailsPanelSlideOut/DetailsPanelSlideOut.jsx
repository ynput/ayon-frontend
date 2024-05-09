import * as Styled from './DetailsPanelSlideOut.styled'
import { useDispatch, useSelector } from 'react-redux'
import { onSlideOutClose } from '/src/features/dashboard'
import DetailsPanel from '../DetailsPanel'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import Shortcuts from '/src/containers/Shortcuts'
import { useEffect, useState } from 'react'
import { classNames } from 'primereact/utils'

const DetailsPanelSlideOut = ({ projectsInfo }) => {
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
      <DetailsPanel
        entityType={entityType}
        entities={[{ id: entityId, projectName }]}
        projectsInfo={{ [projectName]: projectInfo }}
        projectNames={[projectName]}
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

export default DetailsPanelSlideOut
