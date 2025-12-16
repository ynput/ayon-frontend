import { AttributeEnumItem, ProjectModel } from '@shared/api'
import { useAppSelector } from '@state/store'
import { FC, useEffect } from 'react'
import { useDetailsPanelContext } from '@shared/context'
import { ViewerState } from '@state/viewer'
import { useUserDashboardContext } from '@pages/UserDashboardPage/context/UserDashboardContext'

interface RelatedTasksModuleProps {
  isPanelOpen: boolean
  projectsInfo?: Record<string, ProjectModel>
  priorities?: AttributeEnumItem[]
  onOpenViewer?: (state: Partial<ViewerState>) => void
}

export const RelatedTasksModule: FC<RelatedTasksModuleProps> = ({
  isPanelOpen,
  projectsInfo,
  priorities,
  onOpenViewer,
}) => {
  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const viewerTaskId = useAppSelector((state) => state.viewer.taskId)
  const taskData = useAppSelector((state) => state.dashboard.tasks.selectedData)
  const { entities, setEntities, setPanelOpen } = useDetailsPanelContext()
  const { RelatedTasks } = useUserDashboardContext()

  const handleOpenViewer = (taskId: string, projectName: string) => {
    onOpenViewer?.({
      isOpen: true,
      projectName,
      taskId,
      quickView: true,
    })
  }

  const handleSelectRelatedTasks = (
    tasks: { id: string; taskType: string }[],
    projectName: string,
  ) => {
    const selectedTasks = tasks.map((t) => t.id)

    setEntities({
      entityType: 'task',
      entitySubTypes: [...new Set(tasks.map((task) => task.taskType))],
      entities: [...selectedTasks.map((id) => ({ id: id, projectName }))],
    })
    setPanelOpen('dashboard', true)

    // if the viewer is open, then update the taskId to the last selected task
    if (viewerOpen && selectedTasks.length > 0) {
      const lastSelectedTask = selectedTasks[selectedTasks.length - 1]
      handleOpenViewer(lastSelectedTask, projectName)
    }
  }

  // when the taskData changes, clear the entities in the details panel
  useEffect(() => {
    if (isPanelOpen) {
      setEntities(null)
    }
  }, [taskData, isPanelOpen])

  // check if we can show in the viewer dialog
  const viewerNotATask = viewerOpen && !viewerTaskId
  if (viewerNotATask) return null

  const selectedIds = viewerOpen ? [viewerTaskId!] : entities?.entities.map((e) => e.id) || []

  // use powerpack RelatedTasks module
  return (
    <RelatedTasks
      {...{ isPanelOpen, projectsInfo, priorities, taskData: taskData[0], viewerOpen }}
      isPanelOpen={isPanelOpen || !!entities}
      selectedTasks={selectedIds}
      onSelectTasks={handleSelectRelatedTasks}
      onOpenViewer={handleOpenViewer}
    />
  )
}
