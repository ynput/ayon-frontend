import useCreateContextMenu from '@shared/containers/ContextMenu'
import copyToClipboard from '@helpers/copyToClipboard'
import { onTaskSelected } from '@state/dashboard'
import { useSelector } from 'react-redux'
import useOpenTaskInViewer from './useOpenTaskInViewer'
import { toggleDetailsPanel } from '@state/details'

export const useGetTaskContextMenu = (tasks, dispatch, { onOpenInBrowser } = {}) => {
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)
  const isDetailsOpen = useSelector((state) => state.details.open)

  const openTaskInViewer = useOpenTaskInViewer()
  const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent)

  const getContextMenuItems = (task) => {
    return [
      {
        label: isDetailsOpen ? 'Hide details' : 'Show details',
        icon: 'dock_to_left',
        shortcut: isDetailsOpen ? 'Escape' : 'Double click',
        command: () => dispatch(toggleDetailsPanel(!isDetailsOpen)),
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
        shortcut: `${isMacOS ? '⌘' : 'Ctrl'} + Double Click`,
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
