import { CellWithIcon } from '../../components/icons'
import { getFolderTypeIcon, getTaskTypeIcon } from '../../utils'
import { stringEditor, integerEditor, floatEditor } from './editors'


const formatName = (row) => {
  if (row.data.entityType === 'task')
    return (
      <CellWithIcon
        icon={getTaskTypeIcon(row.data.taskType)}
        text={row.data.name}
        textStyle={{ fontStyle: 'italic' }}
      />
    )
  else
    return (
      <CellWithIcon
        icon={getFolderTypeIcon(row.data.folderType)}
        text={row.data.name}
      />
    )
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

export {formatName, getColumns}
