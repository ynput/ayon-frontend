// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { useAppDispatch, useAppSelector } from '@state/store'
import { DetailsPanel, DetailsPanelSlideOut } from '@shared/containers'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { $Any } from '@types'
import { openViewer } from '@state/viewer'
import { useScopedDetailsPanel } from '@shared/context'

type TaskProgressDetailsPanelProps = {
  projectInfo: $Any
  projectName: string
}

const TaskProgressDetailsPanel = ({ projectInfo, projectName }: TaskProgressDetailsPanelProps) => {
  console.log('TaskProgressDetailsPanel')
  const selected = useAppSelector((state) => state.progress.selected)
  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))
  const { setOpen } = useScopedDetailsPanel('progress')

  const projectsInfo = { [projectName]: projectInfo }

  const entities = selected.ids.map((id) => ({ id, projectName }))

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  // Try to get the lists context to enable "Add to list" in more menu
  let entityListsContext: Record<string, unknown> | undefined = undefined
  try {
    entityListsContext = useEntityListsContext() as unknown as Record<string, unknown>
  } catch (error) {
    // context not available outside provider; leave undefined
    // console.log('TaskProgressDetailsPanel - entityListsContext not available:', error)
  }

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
        onClose={() => setOpen(false)}
        onOpenViewer={handleOpenViewer}
        entityListsContext={entityListsContext}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="progress" />
    </>
  )
}

export default TaskProgressDetailsPanel
