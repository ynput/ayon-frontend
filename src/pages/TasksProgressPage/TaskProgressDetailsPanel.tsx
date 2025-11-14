// this is a wrapper around the DetailsPanel
// we do this so that focused changes do not re-render the entire page

import { useAppDispatch, useAppSelector } from '@state/store'
import { DetailsPanel, DetailsPanelSlideOut, useTaskProgressViewSettings } from '@shared/containers'
import { useGetUsersAssigneeQuery } from '@shared/api'
import { $Any } from '@types'
import { openViewer } from '@state/viewer'
import { useScopedDetailsPanel } from '@shared/context'
import useGoToEntity from '@pages/ProjectOverviewPage/hooks/useGoToEntity'
import { useSlicerContext } from '@context/SlicerContext'
import { selectProgress } from '@state/progress'

type TaskProgressDetailsPanelProps = {
  projectInfo: $Any
  projectName: string
}

const TaskProgressDetailsPanel = ({ projectInfo, projectName }: TaskProgressDetailsPanelProps) => {
  const selected = useAppSelector((state) => state.progress.selected)
  const dispatch = useAppDispatch()
  const handleOpenViewer = (args: any) => dispatch(openViewer(args))
  const { setOpen, isOpen } = useScopedDetailsPanel('progress')
  const { onUpdateFilters: setQueryFilters } = useTaskProgressViewSettings()

  const projectsInfo = { [projectName]: projectInfo }

  const entities = selected.ids.map((id) => ({ id, projectName }))

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

  //   slicer context
  const slicer = useSlicerContext()

  const { goToEntity } = useGoToEntity({
    page: 'progress',
    onViewUpdate: () => {
      // reset filters
      setQueryFilters({})
    },
    onExpand: (expanded) => {
      // open slicer folders
      slicer.setExpanded(expanded)
    },
    onSelection: (selected, entityType) => {
      dispatch(selectProgress({ ids: selected, type: entityType as 'task' | 'folder' }))
      setOpen(true)
    },
    onParentSelection: (parentId) => {
      slicer.setRowSelection({ [parentId]: true })
    },
  })

  return (
    <>
      {/* @ts-ignore */}
      <DetailsPanel
        // entitySubTypes={subTypes}
        isOpen={isOpen && !!entities.length}
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
        onUriOpen={(entity) =>
          goToEntity(entity.id, entity.entityType, { folder: entity.folder?.id })
        }
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="progress" />
    </>
  )
}

export default TaskProgressDetailsPanel
