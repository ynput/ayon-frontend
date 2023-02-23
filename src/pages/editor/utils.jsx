import ayonClient from '/src/ayon'
import { CellWithIcon } from '/src/components/icons'
import { stringEditor, integerEditor, floatEditor, enumEditor } from './editors'

// TODO rename .jsx -> .js
const formatAttribute = (node, changes, fieldName, styled = true) => {
  const chobj = changes[node.id]
  let className = ''
  let value = node.attrib[fieldName]
  if (chobj && fieldName in chobj) {
    value = chobj[fieldName]
    className = 'changed'
  } else if (node.ownAttrib && !node.ownAttrib.includes(fieldName)) {
    className = 'inherited'
  }
  if (!styled) return value

  return <span className={`editor-field ${className}`}>{value}</span>
}

const formatName = (node, changes, styled = true, project) => {
  const chobj = changes[node.id]
  let value = chobj?._name ? chobj._name : node.name

  console.log(chobj)

  if (!styled) return value

  let icon
  const textStyle = {}
  if (!value) textStyle.color = 'var(--color-hl-error)'
  if (chobj && '_name' in chobj) textStyle.color = 'var(--color-hl-changed)'

  if (node.__entityType === 'task') {
    icon = project.tasks[chobj?._taskType || node.taskType]?.icon || 'help_center'
    textStyle.fontStyle = 'italic'
    value = value || 'Unnamed task'
  } else {
    icon = project.folders[chobj?._folderType || node.folderType]?.icon || 'help_center'
    value = value || 'Unnamed folder'
  }

  return <CellWithIcon icon={icon} text={value} textStyle={textStyle} />
}

const formatType = (node, changes, styled = true) => {
  const chobj = changes[node.id] || {}
  const style = {}
  let value

  if (node.__entityType === 'folder') {
    value = '_folderType' in chobj ? chobj._folderType : node.folderType
    if ('_folderType' in chobj) style.color = 'var(--color-hl-changed)'
  } else {
    value = chobj?._taskType ? chobj._taskType : node.taskType
    if (!value) style.color = 'var(--color-hl-error)'
    else if ('_taskType' in chobj) style.color = 'var(--color-hl-changed)'
  }

  if (!styled) return value
  if (node.__entityType === 'folder' && !value) value = 'Folder'
  return (
    <span className="editor-field" style={style}>
      {value}
    </span>
  )
}

const getColumns = () => {
  if (ayonClient.settings.attributes.length === 0) return []
  let cols = []
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('folder')) {
      let editor
      if (attrib.data.type === 'integer') {
        editor = integerEditor
      } else if (attrib.data.type === 'float') {
        editor = floatEditor
      } else if (attrib.data.enum && attrib.data.enum.length > 0) {
        editor = enumEditor
      } else {
        editor = stringEditor
      }
      cols.push({
        name: attrib.name,
        title: attrib.data.title,
        editor: editor,
        editorSettings: attrib.data,
      })
    }
  }
  return cols
}

export { getColumns, formatName, formatType, formatAttribute }
