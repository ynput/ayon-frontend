import ayonClient from '@/ayon'
import { AssigneeSelect, EnumTemplate, Icon } from '@ynput/ayon-react-components'
import { TimestampField } from '@containers/fieldFormat'
import { useSelector } from 'react-redux'
import ToolsField from './fields/ToolsField'
import { StyledStatus } from './utils.styled'

const formatAttribute = (node, changes, fieldName, styled = true) => {
  const chobj = changes[node.id]

  let tooltip = null
  let className = ''
  let value = node.attrib && node.attrib[fieldName]
  let isChanged = false
  if (chobj && fieldName in chobj) {
    isChanged = true
    // if value is null then it inherits (default value)
    value = chobj[fieldName] || '(inherited)'
    className = 'changed'
    // show changed style and inherited style if the change was to set to null (inherited)
    if (chobj[fieldName] === null) className += ' inherited'
  } else if (node.ownAttrib && !node.ownAttrib.includes(fieldName)) {
    className = 'inherited'
  }

  if (!styled) return value

  if (ayonClient.settings.attributes.length) {
    const attribSettings = ayonClient.settings.attributes.find(
      (attrib) => attrib.name === fieldName,
    ).data
    const fieldType = attribSettings.type
    if (fieldName === 'tools' && value)
      return <ToolsField value={value} className={className} attrib={attribSettings} />
    else if (fieldType === 'datetime') return <TimestampField value={value} ddOnly />
    else if (fieldType === 'boolean')
      return !value ? '' : <Icon icon="check" className={`editor-field ${className}`} />
    else if (fieldType === 'string') {
      const _enum = attribSettings.enum
      if (!value?.length || !_enum) {
        return value || ''
      }

      const option = _enum.find((item) => item.value === value)
      const changedStyles = {
        backgroundColor: 'var(--color-changed)',
        borderRadius: 'var(--border-radius-m)',
        paddingLeft: 4,
      }
      return (
        <EnumTemplate
          option={option}
          isChanged={isChanged}
          style={isChanged ? changedStyles : { paddingLeft: 4 }}
        />
      )
    } else if (fieldType === 'list_of_strings' && typeof value === 'object') {
      if (!value?.length) return ''
      const _enum = attribSettings.enum

      const labels = _enum
        .filter((item) => value.includes(item.value))
        .map((item) => item.label || item.value)
      const values = _enum.filter((item) => value.includes(item.value)).map((item) => item.value)
      value = labels.join(', ')
      tooltip = values.join(', ')
    }
  }

  return (
    <span className={`editor-field ${className}`} title={tooltip}>
      {value}
    </span>
  )
}

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

export { getColumns, formatType, formatAttribute, formatAssignees, formatStatus }
