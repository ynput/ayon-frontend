import useCreateContext from '/src/hooks/useCreateContext'
import copyToClipboard from '/src/helpers/copyToClipboard'
import useUriNavigate from '/src/hooks/useUriNavigate'

export const useGetTaskContextMenu = (tasks) => {
  // URI NAVIGATE ON RIGHT CLICK
  const navigateToUri = useUriNavigate()

  const getContextMenuItems = (card) => {
    return [
      {
        label: 'Open in Browser',
        command: () => navigateToUri(`ayon+entity://${card.path}?task=${card.name}`),
        icon: 'open_in_new',
      },
      {
        label: 'Copy task ID',
        command: () => copyToClipboard(card.id),
        icon: 'content_copy',
      },
      {
        label: 'Copy latest version ID',
        command: () => copyToClipboard(card.latestVersionId),
        icon: 'content_copy',
        disabled: !card.latestVersionId,
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

    // get context model
    const contextMenuItems = getContextMenuItems(card)
    // show context menu
    showContextMenu(e, contextMenuItems)
  }

  return { handleContextMenu, closeContext }
}

export default useGetTaskContextMenu
