// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import DetailsPanel from '/src/containers/DetailsPanel/DetailsPanel'
import DetailsPanelSlideOut from '/src/containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'

const BrowserDetailsPanel = () => {
  const projectName = useSelector((state) => state.project.name)
  const projectInfo = useSelector((state) => state.project)
  const { statuses = {}, statusesOrder = [], tags = {}, tagsOrder } = projectInfo
  const statusesOptions = statusesOrder.map((status) => statuses[status] && { ...statuses[status] })
  const tagsOptions = tagsOrder.map((tag) => tags[tag] && { ...tags[tag] })

  const projectsInfo = {
    [projectName]: {
      ...projectInfo,
      statuses: statusesOptions,
      tags: tagsOptions,
      projectNames: [{ id: projectName, name: projectName }],
    },
  }

  const subscribedStateFields = ['versions', 'products', 'folders', 'tasks']

  const focused = useSelector(
    (state) => state.context.focused,
    (a, b) => {
      // compare subscribed states and if any are different, return false
      for (const field of subscribedStateFields) {
        if (!isEqual(a[field], b[field])) return false
      }

      return true
    },
  )

  let { type: entityType } = focused
  // if entityType is representation, entityType stays as versions because we use a slide out
  if (entityType === 'representation') entityType = 'version'
  const entityIds = focused[entityType + 's'] || []
  const entities = entityIds.map((id) => ({ id, projectName }))

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  if (!entities.length) return null

  return (
    <>
      <DetailsPanel
        entityType={entityType}
        entities={entities}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
        statusesOptions={statusesOptions}
        tagsOptions={tagsOptions}
        projectUsers={users}
        activeProjectUsers={users}
        style={{ boxShadow: 'none' }}
        scope="project"
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="project" />
    </>
  )
}

export default BrowserDetailsPanel
