import useCreateContext from '/src/hooks/useCreateContext'
import copyToClipboard from '/src/helpers/copyToClipboard'

export const useGetTaskContextMenu = (tasks) => {
  const getContextMenuItems = (taskId, latestVersionId) => {
    return [
      {
        label: 'Copy task ID',
        command: () => copyToClipboard(taskId),
        icon: 'content_copy',
      },
      {
        label: 'Copy latest version ID',
        command: () => copyToClipboard(latestVersionId),
        icon: 'content_copy',
        disabled: !latestVersionId,
      },
    ]
  }

  const [showContextMenu] = useCreateContext([])

  const handleContextMenu = (e) => {
    // find the parent with className card
    let el = e.target
    const taskId = el.closest('.card')
    if (!taskId) return
    // find card
    const card = tasks.find((t) => t.id === taskId.id)

    if (!card) return

    // get context model
    const contextMenuItems = getContextMenuItems(card.id, card.latestVersionId)
    // show context menu
    showContextMenu(e, contextMenuItems)
  }

  return handleContextMenu
}

export default useGetTaskContextMenu
