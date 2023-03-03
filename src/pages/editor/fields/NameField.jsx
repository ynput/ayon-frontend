import React from 'react'
import { CellWithIcon } from '/src/components/icons'

const NameField = ({
  node,
  changes,
  styled = true,
  tasks = {},
  folders = {},
  style,
  iconStyle,
}) => {
  const chobj = changes[node.id]
  let value = chobj?._name || chobj?._name === '' ? chobj._name : node.name

  if (!styled) return value

  let icon
  const textStyle = {}
  // check for errors
  if (chobj?.errors?._name) {
    textStyle.color = 'var(--color-hl-error)'
  }
  if (chobj && '_name' in chobj) textStyle.color = 'var(--color-hl-changed)'

  if (node.__entityType === 'task') {
    icon = tasks[chobj?._taskType || node.taskType]?.icon || 'help_center'
    textStyle.fontStyle = 'italic'
    value = value || 'Unnamed task'
  } else {
    icon = folders[chobj?._folderType || node.folderType]?.icon || 'help_center'
    value = value || 'Unnamed folder'
  }

  return <CellWithIcon icon={icon} text={value} {...{ style, iconStyle, textStyle }} />
}

export default NameField
