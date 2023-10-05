import React from 'react'
import { useSelector } from 'react-redux'
import Menu from '/src/components/Menu/MenuComponents/Menu'

const ColumnMenu = ({
  onCollapse,
  isCustom,
  otherColumns = [],
  currentColumns = [],
  onAdd,
  onRemove,
  onRename,
  onDelete,
  onCreate,
  ...props
}) => {
  const user = useSelector((state) => state.user)
  const isUser = user.data.isUser

  const items = [
    {
      id: 'collapse',
      label: 'Collapse',
      onClick: onCollapse,
    },
  ]

  if (!isUser && otherColumns.length) {
    if (isCustom) {
      items.push({
        id: 'add',
        label: 'Add Column',
        items: otherColumns.map((c, i) => ({
          id: c.id,
          label: c.name,
          index: i,
          onClick: onAdd,
        })),
      })

      if (currentColumns.length > 1) {
        items.push({
          id: 'remove',
          label: 'Remove Column',
          items: currentColumns.map((c) => ({
            id: c.id,
            label: c.name,
            onClick: onRemove,
          })),
        })
      }

      items.push({
        id: 'rename',
        label: 'Rename Group',
        onClick: onRename,
      })

      items.push({
        id: 'delete',
        label: 'Delete Group',
        onClick: onDelete,
      })
    } else {
      items.push({
        id: 'create',
        label: 'Create Group',
        onClick: onCreate,
      })
    }
  }

  return <Menu menu={items} {...props} compact />
}

export default ColumnMenu
