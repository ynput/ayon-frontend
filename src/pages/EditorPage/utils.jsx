import ayonClient from '/src/ayon'
import { AssigneeSelect, Icon } from '@ynput/ayon-react-components'
import { TimestampField } from '/src/containers/fieldFormat'
import { useSelector } from 'react-redux'
import ToolsField from './fields/ToolsField'
import styled, {css} from 'styled-components'

const updatedStyles = css`
  background-color: var(--color-changed);
  outline: 1px solid var(--color-changed);
  color: var(--md-sys-color-on-primary);
    border-radius: var(--border-radius-m);
  > .icon {
    color: var(--md-sys-color-on-primary);
  }
`

const StyledIcon = styled.div`
    display: flex;
    color: ${({ $color }) => $color};
    > .icon {
      font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
      color: ${({ $color }) => $color};
    }
  ${({ $isUpdated }) => ($isUpdated && css`${updatedStyles}`)}
`

const formatAttribute = (node, changes, fieldName, styled = true) => {
  const chobj = changes[node.id]

  let tooltip = null
  let className = ''
  let value = node.attrib && node.attrib[fieldName]
  if (chobj && fieldName in chobj) {
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
    else if (fieldType === 'list_of_strings' && typeof value === 'object') {
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

const formatStatus = (node, changes) => {
  const updatedStatus = changes[node.id] || {}
  const originalStatusValue = node.status
  const updatedStatusValue = updatedStatus._status
  const statusValue = updatedStatusValue || originalStatusValue

  const statusesObject = useSelector((state) => state.project.statuses)
  const selectedStatus = statusesObject[statusValue] ? statusesObject[statusValue] : {}

  const { name, icon, color } = selectedStatus

  return (
    <span >
        <StyledIcon className="editor-field" $isUpdated={!!updatedStatusValue} $color={color}>
          {icon && <Icon icon={icon} />}
          <span style={{marginLeft: 8}}>{name}</span>
        </StyledIcon>
    </span>
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
