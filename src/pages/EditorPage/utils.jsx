import ayonClient from '@/ayon'
import { AssigneeSelect, Icon } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'
import { StyledStatus } from './utils.styled'

const formatType = (node, changes, styled = true) => {
  const chobj = changes[node.id] || {}
  const style = {}
  let value

  if (node.__entityType === 'folder') {
    value = '_folderType' in chobj ? chobj._folderType : node.folderType
    if ('_folderType' in chobj) style.color = 'var(--color-changed)'
  } else {
    value = chobj?._taskType ? chobj._taskType : node.taskType
    if (!value) style.color = 'var(--color-hl-error)'
    else if ('_taskType' in chobj) style.color = 'var(--color-changed)'
  }

  if (!styled) return value
  if (node.__entityType === 'folder' && !value) value = 'Folder'
  return (
    <span className="editor-field" style={style}>
      {value}
    </span>
  )
}

const formatStatus = (node, changes, width) => {
  const resolveWidth = (statusWidth) => {
    if (statusWidth < 70) return 'icon'
    if (statusWidth < 140) return 'short'
    return 'full'
  }
  const size = resolveWidth(width)
  const updatedStatus = changes[node.id] || {}
  const originalStatusName = node.status
  const updatedStatusName = updatedStatus._status
  const statusName = updatedStatusName || originalStatusName

  const allStatuses = useSelector((state) => state.project.statuses)
  const selectedStatus = allStatuses[statusName] ? allStatuses[statusName] : {}

  const { name, icon, color, shortName } = selectedStatus

  return (
    <StyledStatus className="editor-field" $isUpdated={!!updatedStatusName} $color={color}>
      {icon && <Icon icon={icon} />}
      {size !== 'icon' && <span className="statusName">{size === 'full' ? name : shortName}</span>}
    </StyledStatus>
  )
}

const formatAssignees = (node, changes, allUsers) => {
  // only show for tasks
  if (node.__entityType === 'folder') return null
  const chobj = changes[node.id] || {}
  const isChanged = '_assignees' in chobj
  const value = chobj._assignees ? chobj._assignees : node.assignees

  const className = isChanged ? 'editor-field changed' : 'editor-field'

  return (
    <div className={className}>
      <AssigneeSelect
        value={value}
        options={allUsers}
        emptyMessage=""
        emptyIcon={false}
        buttonStyle={{
          border: '1px solid var(--md-sys-color-outline-variant)',
          overflow: 'hidden',
        }}
        readOnly
        align="left"
      />
    </div>
  )
}

const getColumns = () => {
  if (ayonClient.settings.attributes.length === 0) return []
  let cols = []
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('folder')) {
      cols.push({
        name: attrib.name,
        title: attrib.data.title,
        type: attrib.data.type,
      })
    }
  }

  return cols
}

export { getColumns, formatType, formatAssignees, formatStatus }
