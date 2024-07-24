import useCreateContext from '@hooks/useCreateContext'
import copyToClipboard from '@helpers/copyToClipboard'
import { onTaskSelected } from '@state/dashboard'
import { useSelector } from 'react-redux'
import { useURIContext } from '@context/uriContext'
import { getTaskRoute } from '@helpers/routes'

export const useGetTaskContextMenu = (tasks, dispatch) => {
  // URI NAVIGATE ON RIGHT CLICK
  const { navigate: navigateToUri } = useURIContext()
  const selectedTasks = useSelector((state) => state.dashboard.tasks.selected)

  const getContextMenuItems = (card) => {
    return [
      {
        label: 'Open in Browser',
        command: () => navigateToUri(getTaskRoute(card)),
        icon: 'open_in_new',
        disabled: selectedTasks.includes(card.id) && selectedTasks.length > 1,
      },
      {
        label: 'Copy task ID',
        command: () => copyToClipboard(card.id),
        icon: 'content_copy',
        disabled: selectedTasks.includes(card.id) && selectedTasks.length > 1,
      },
      {
        label: 'Copy latest version ID',
        command: () => copyToClipboard(card.latestVersionId),
        icon: 'content_copy',
        disabled: !card.latestVersionId || selectedTasks.length > 1,
      },
    ]
  }

  const [showContextMenu, closeContext] = useCreateContext([])

  const handleContextMenu = (e) => {
    // find the parent with className card
    let el = e.target
    const taskId = el.closest('.card')
    if (!taskId) return
    // find card
    const card = tasks.find((t) => t.id === taskId.id)

    if (!card) return

    // if task not already selected, select it and remove all other selections
    if (!selectedTasks.includes(card.id)) {
      dispatch(onTaskSelected({ ids: [card.id], types: [card.taskType] }))
    }

    // get context model
    const contextMenuItems = getContextMenuItems(card)
    // show context menu
    showContextMenu(e, contextMenuItems)
  }

  return { handleContextMenu, closeContext }
}

export default useGetTaskContextMenu
