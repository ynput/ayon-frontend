// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { useSelector } from 'react-redux'
import useFocusedEntities from '@hooks/useFocused'
import { useAppDispatch } from '@state/store'
import { openViewer } from '@state/viewer'
// shared
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useGetUsersAssigneeQuery, useGetProjectsInfoQuery } from '@shared/api'

const BrowserDetailsPanel = () => {
  const projectName = useSelector((state) => state.project.name)

  const dispatch = useAppDispatch()
  const handleOpenViewer = (args) => dispatch(openViewer(args))

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery({ projects: [projectName] })
  const projectInfo = projectsInfo[projectName] || {}

  // if entityType is representation, entityType stays as versions because we use a slide out
  const { entities, entityType, subTypes } = useFocusedEntities(projectName)

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  if (!entities.length) return null

  return (
    <>
      <DetailsPanel
        entitySubTypes={subTypes}
        entityType={entityType}
        entities={entities}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
        tagsOptions={projectInfo.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        style={{ boxShadow: 'none' }}
        scope="project"
        onOpenViewer={handleOpenViewer}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="project" />
    </>
  )
}

export default BrowserDetailsPanel
