import { CellWithIcon } from '../../components/icons'
import { getFolderTypeIcon, getTaskTypeIcon } from '../../utils'
import { stringEditor, integerEditor, floatEditor } from './editors'


const formatAttribute = (node, changes, fieldName, styled = true) => {
  const chobj = changes[node.id]
  let className = ''
  let value = node.attrib[fieldName]
  if (chobj && chobj.hasOwnProperty(fieldName)) {
    value = chobj[fieldName]
    className = 'changed'
  } else if (node.ownAttrib && !node.ownAttrib.includes(fieldName)) {
    className = 'inherited'
  }
  if (!styled) return value

  return <span className={`editor-field ${className}`}>{value}</span>
}

const formatName = (node, changes, styled = true) => {
  const chobj = changes[node.id]
  const className = chobj?._name ? 'color-hl-01' : ''
  const value = chobj?._name ? chobj._name : node.name
  if (!styled) return value
  if (node.__entityType === 'task')
    return (
      <CellWithIcon
        icon={getTaskTypeIcon(node.taskType)}
        text={value || 'Unnamed task'}
        textStyle={{ fontStyle: 'italic' }}
        textClassName={{ className }}
      />
    )
  else
    return (
      <CellWithIcon
        icon={getFolderTypeIcon(node.folderType)}
        textClassName={{ className }}
        text={value || 'Unnamed folder'}
      />
    )
}

const formatType = (node, changes, styled = true) => {
  const chobj = changes[node.id] || {}
  let className
  let value

  if (node.__entityType === "folder"){
    className = "_folderType" in chobj ? 'color-hl-01' : ''
    value = "_folderType" in chobj ? chobj._folderType : node.folderType // || "Folder"
  } else {
    className = chobj?._taskType ? 'color-hl-01' : ''
    value = chobj?._taskType ? chobj._taskType : node.taskType
  }

  if (!styled)
    return value
  return <span className={`editor-field ${className}`}>{value}</span>
}


const getColumns = (attributes) => {
  if (!attributes) return []
  let cols = []
  for (const attrib of attributes) {
    if (attrib.scope.includes('folder')) {
      let editor
      if (attrib.attribType === 'integer') {
        editor = integerEditor
      } else if (attrib.attribType === 'float') {
        editor = floatEditor
      } else {
        editor = stringEditor
      }
      cols.push({
        name: attrib.name,
        title: attrib.title,
        editor: editor,
      })
    }
  }
  return cols
}

export { getColumns, formatName, formatType, formatAttribute }
