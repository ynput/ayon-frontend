import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { copyToClipboard } from '@shared/util'
import { onTaskSelected } from '@state/dashboard'
import { useSelector } from 'react-redux'
import useOpenTaskInViewer from './useOpenTaskInViewer'
import { useScopedDetailsPanel } from '@shared/context'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'

export const useGetTaskContextMenu = (tasks, dispatch, { onOpenInOverview } = {}) => {
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const { setOpen, isOpen } = useScopedDetailsPanel('dashboard')

  const openTaskInViewer = useOpenTaskInViewer()

  const selectTask = (task) =>
    dispatch(
      onTaskSelected({
        ids: [task.id],
        types: [task.taskType],
        data: [
          {
            id: task.id,
            projectName: task.projectName,
            taskType: task.taskType,
            name: task.name,
          },
        ],
      }),
    )

  const getContextMenuItems = (task) => {
    const isSelected = selectedTasks.includes(task.id)
    const showsDetails = isOpen && isSelected
    return [
      {
        label: showsDetails ? 'Hide details' : 'Show details',
        icon: 'dock_to_left',
        shortcut: showsDetails ? 'Escape' : 'Double click',
        command: () => {
          if (!isSelected) selectTask(task)
          setOpen(!showsDetails)
        },
      },
      {
        label: 'Open in viewer',
        command: () => openTaskInViewer(task),
        icon: 'play_circle',
        shortcut: 'Spacebar',
      },
      {
        label: 'Open in overview',
        command: () => onOpenInOverview(task),
        icon: 'open_in_new',
        shortcut: `${getPlatformShortcutKey('Double Click', [KeyMode.Ctrl])}`,
      },
      {
        label: 'Copy task ID',
        command: () => copyToClipboard(task.id),
        icon: 'content_copy',
        disabled: isSelected && selectedTasks.length > 1,
      },
      {
        label: 'Copy latest version ID',
        command: () => copyToClipboard(task.latestVersionId),
        icon: 'content_copy',
        disabled: !task.latestVersionId || (isSelected && selectedTasks.length > 1),
      },
    ]
  }

  const [showContextMenu, closeContext] = useCreateContextMenu([])

  const handleContextMenu = (e) => {
    // find the parent with className card
    let el = e.target
    const taskId = el.closest('.card')
    if (!taskId) return
    // find card
    const selectedTask = tasks.find((t) => t.id === taskId.id)

    if (!selectedTask) return

    // get context model
    const contextMenuItems = getContextMenuItems(selectedTask)
    // show context menu
    showContextMenu(e, contextMenuItems)
  }

  return { handleContextMenu, closeContext }
}

export default useGetTaskContextMenu
