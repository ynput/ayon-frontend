import React from 'react'
import { CellWithIcon } from '@components/icons'
import getEntityTypeIcon from '@helpers/getEntityTypeIcon'

const NameField = ({
  node,
  changes,
  styled = true,
  tasks = {},
  folders = {},
  productTypes = {},
  style,
  iconStyle,
  prefix,
}) => {
  if (!node) return null

  const chobj = changes[node.id]
  let value = chobj?._name || chobj?._name === '' ? chobj._name : node.name
  const name = value
  // is label
  const label = chobj?._label || chobj?._label === '' ? chobj._label : node.label

  if (label) value = label

  if (!styled) return value

  let icon
  const textStyle = {}
  // check for errors
  if (chobj?.errors?._name) {
    textStyle.color = 'var(--color-hl-error)'
  }
  if (chobj && '_name' in chobj) textStyle.color = 'var(--color-changed)'

  if (node.__entityType === 'task') {
    icon = tasks[chobj?._taskType || node.taskType]?.icon || getEntityTypeIcon('task')
    // textStyle.fontStyle = 'italic'
    value = value || 'Unnamed task'
  } else if (node.__entityType === 'folder') {
    icon = folders[chobj?._folderType || node.folderType]?.icon || getEntityTypeIcon('folder')
    value = value || 'Unnamed folder'
  } else if (['product', 'version'].includes(node.__entityType)) {
    icon =
      productTypes[node.productType || node.product?.productType]?.icon ||
      getEntityTypeIcon('version')
  }

  if (value === undefined) return ''

  return (
    <CellWithIcon
      icon={icon}
      text={`${
        prefix && !['undefined', 'null', ''].includes(prefix) ? prefix + ' | ' : ''
      }${value}`}
      {...{ style, iconStyle, textStyle }}
      name={name}
    />
  )
}

export default NameField
