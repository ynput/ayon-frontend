// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { useDispatch, useSelector } from 'react-redux'
import DetailsPanel from '@containers/DetailsPanel/DetailsPanel'
import DetailsPanelSlideOut from '@containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { toggleDetailsPanel } from '@state/details'

const TaskProgressDetailsPanel = ({ projectInfo, projectName }) => {
  const selectedTasks = useSelector((state) => state.context.focused.tasks)
  const dispatch = useDispatch()
  const projectsInfo = { [projectName]: projectInfo }

  const entities = selectedTasks.map((id) => ({ id, projectName }))

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  if (!entities.length) return null

  return (
    <>
      <DetailsPanel
        // entitySubTypes={subTypes}
        entityType={'task'}
        entities={entities}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
        statusesOptions={projectInfo.statuses || []}
        tagsOptions={projectInfo.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        style={{ boxShadow: 'none' }}
        scope="progress"
        onClose={() => dispatch(toggleDetailsPanel())}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="progress" />
    </>
  )
}

export default TaskProgressDetailsPanel
