import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { copyToClipboard } from '@shared/util'
import { onTaskSelected } from '@state/dashboard'
import { useSelector } from 'react-redux'
import useOpenTaskInViewer from './useOpenTaskInViewer'
import { useScopedDetailsPanel } from '@shared/context'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'

export const useGetTaskContextMenu = (tasks, dispatch, { onOpenInBrowser } = {}) => {
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const { setOpen, isOpen } = useScopedDetailsPanel('dashboard')

  const openTaskInViewer = useOpenTaskInViewer()

  const getContextMenuItems = (task) => {
    return [
      {
        label: isOpen ? 'Hide details' : 'Show details',
        icon: 'dock_to_left',
        shortcut: isOpen ? 'Escape' : 'Double click',
        command: () => setOpen(!isOpen),
      },
      {
        label: 'Open in viewer',
        command: () => openTaskInViewer(task),
        icon: 'play_circle',
        shortcut: 'Spacebar',
      },
      {
        label: 'Open in browser',
        command: () => onOpenInBrowser(task),
        icon: 'open_in_new',
        shortcut: `${getPlatformShortcutKey('Double Click', [KeyMode.Ctrl])}`,
      },
      {
        label: 'Copy task ID',
        command: () => copyToClipboard(task.id),
        icon: 'content_copy',
        disabled: selectedTasks.includes(task.id) && selectedTasks.length > 1,
      },
      {
        label: 'Copy latest version ID',
        command: () => copyToClipboard(task.latestVersionId),
        icon: 'content_copy',
        disabled: !task.latestVersionId || selectedTasks.length > 1,
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

    // if task not already selected, select it and remove all other selections
    if (!selectedTasks.includes(selectedTask.id)) {
      dispatch(onTaskSelected({ ids: [selectedTask.id], types: [selectedTask.taskType] }))
    }

    // get context model
    const contextMenuItems = getContextMenuItems(selectedTask)
    // show context menu
    showContextMenu(e, contextMenuItems)
  }

  return { handleContextMenu, closeContext }
}

export default useGetTaskContextMenu
