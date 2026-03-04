import { Menu } from '@shared/components'
import { copyToClipboard } from '@shared/util'

interface ActivityCommentMenuProps {
  onDelete?: () => void
  onEdit?: () => void
  onSelect?: () => void
  activityId: string
  projectName: string
}

const ActivityCommentMenu = ({
  onDelete,
  onEdit,
  onSelect,
  activityId,
  projectName,
}: ActivityCommentMenuProps) => {
  const items = []

  const handleCopyActivityLink = () => {
    const searchParams = new URLSearchParams(window.location.search)
    // get type
    const type = searchParams.get('type')
    const tab = type === 'version' ? 'products' : 'overview'
    const pathname = `/projects/${projectName}/${tab}`
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('activity', activityId)
    const url = new URL(window.location.origin + pathname)
    url.search = newSearchParams.toString()

    copyToClipboard(url.toString())
  }

  items.push({
    id: 'copy-link',
    label: 'Copy link',
    icon: 'link',
    onClick: () => {
      onSelect?.()
      handleCopyActivityLink()
    },
  })

  if (onEdit) {
    items.push({
      id: 'edit',
      label: 'Edit',
      icon: 'edit_square',
      onClick: () => {
        onSelect?.()
        onEdit()
      },
    })
  }

  if (onDelete) {
    items.push({
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      onClick: () => {
        onSelect?.()
        onDelete()
      },
      danger: true,
    })
  }

  return <Menu menu={items} />
}

export default ActivityCommentMenu
