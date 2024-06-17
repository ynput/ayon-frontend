import Menu from '@components/Menu/MenuComponents/Menu'

const ActivityCommentMenu = ({ onDelete }) => {
  const items = []

  if (onDelete) {
    items.push({
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      onClick: onDelete,
      danger: true,
    })
  }

  return <Menu menu={items} />
}

export default ActivityCommentMenu
