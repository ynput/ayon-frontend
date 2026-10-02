import { Menu } from '@shared/components/Menu/Menu'
import { copyToClipboard } from '@shared/util'
import { getActivityLink } from '../../helpers/getActivityLink'

interface ActivityCommentMenuProps {
  onDelete?: () => void
  onEdit?: () => void
  onCopyText?: () => void
  onDuplicate?: () => void
  onSelect?: () => void
  activityId: string
  projectName: string
  // the entity the comment was posted on, the link opens its feed
  entity?: { id: string; type: string }
}

const ActivityCommentMenu = ({
  onDelete,
  onEdit,
  onCopyText,
  onDuplicate,
  onSelect,
  activityId,
  projectName,
  entity,
}: ActivityCommentMenuProps) => {
  const items = []

  const withSelect = (action: () => void) => () => {
    onSelect?.()
    action()
  }

  if (onEdit) {
    items.push({
      id: 'edit',
      label: 'Edit',
      icon: 'edit_square',
      onClick: withSelect(onEdit),
    })
  }

  if (onCopyText) {
    items.push({
      id: 'copy-text',
      label: 'Copy text',
      icon: 'content_copy',
      onClick: withSelect(onCopyText),
    })
  }

  if (onDuplicate) {
    items.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'library_add',
      onClick: withSelect(onDuplicate),
    })
  }

  items.push({
    id: 'copy-link',
    label: 'Copy link',
    icon: 'link',
    onClick: withSelect(() => copyToClipboard(getActivityLink(projectName, activityId, entity))),
  })

  if (onDelete) {
    items.push({
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      onClick: withSelect(onDelete),
      danger: true,
    })
  }

  return <Menu menu={items} />
}

export default ActivityCommentMenu
