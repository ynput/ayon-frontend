// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { useAppDispatch, useAppSelector } from '@state/store'
import DetailsPanel from '@containers/DetailsPanel/DetailsPanel'
import DetailsPanelSlideOut from '@containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import { toggleDetailsOpen } from '@state/progress'
import { $Any } from '@types'

type TaskProgressDetailsPanelProps = {
  projectInfo: $Any
  projectName: string
}

const TaskProgressDetailsPanel = ({ projectInfo, projectName }: TaskProgressDetailsPanelProps) => {
  const selected = useAppSelector((state) => state.progress.selected)
  const dispatch = useAppDispatch()
  const projectsInfo = { [projectName]: projectInfo }

  const entities = selected.ids.map((id) => ({ id, projectName }))

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  if (!entities.length) return null

  return (
    <>
      {/* @ts-ignore */}
      <DetailsPanel
        // entitySubTypes={subTypes}
        entityType={selected.type}
        entities={entities as any}
        projectsInfo={projectsInfo}
        projectNames={[projectName] as any}
        tagsOptions={projectInfo.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        style={{ boxShadow: 'none' }}
        scope="progress"
        onClose={() => dispatch(toggleDetailsOpen(false))}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="progress" />
    </>
  )
}

export default TaskProgressDetailsPanel
