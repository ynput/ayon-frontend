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
  let value = chobj?._name ? chobj._name : node.name

  if (!styled) return value

  let icon
  const textStyle = {}
  if (!value)
    textStyle.color = "var(--color-hl-error)"
  if (chobj?.hasOwnProperty("_name"))
    textStyle.color = "var(--color-hl-changed)"

  if (node.__entityType === 'task'){
    icon = getTaskTypeIcon(node.taskType) 
    textStyle.fontStyle = "italic"
    value = value || "Unnamed task"
  } else {
    icon = getFolderTypeIcon(node.taskType)
    value = value || "Unnamed folder"
  }
  
  return (
    <CellWithIcon
      icon={icon}
      text={value}
      textStyle={textStyle}
    />
  )
}

const formatType = (node, changes, styled = true) => {
  const chobj = changes[node.id] || {}
  const style = {}
  let value

  if (node.__entityType === "folder"){
    value = "_folderType" in chobj ? chobj._folderType : node.folderType // || "Folder"
    if ("_folderType" in chobj)
      style.color = "var(--color-hl-changed)"
  } else {
    value = chobj?._taskType ? chobj._taskType : node.taskType
    if (!value)
      style.color = "var(--color-hl-error)"
    else if ("_taskType" in chobj)
      style.color = "var(--color-hl-changed)"
    
  }

  if (!styled)
    return value
  return <span className="editor-field" style={style}>{value}</span>
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
