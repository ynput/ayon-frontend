import ayonClient from '@/ayon'
import { Icon } from '@ynput/ayon-react-components'
import { TimestampField } from '@containers/fieldFormat'
import ToolsField from './fields/ToolsField'
import { ReactNode } from 'react'
import { FolderAttribModel, FolderModel, TaskAttribModel, TaskModel } from '@api/rest'


const formatAttribute = (
  node: TaskModel | FolderModel,
  changes: { [x: string]: any },
  fieldName: keyof TaskAttribModel | keyof FolderAttribModel,
  styled: boolean = true,
): String | ReactNode => {
  const getClassName = (): string => {
    if (chobj && fieldName in chobj) {
      return chobj[fieldName] === null ? 'changed inherited' : 'changed'
    }
    if (node.ownAttrib && !node.ownAttrib.includes(fieldName)) {
      return 'inherited'
    }

    return ''
  }

  const getValue = (): string | number | string[] | undefined => {
    if (chobj && fieldName in chobj) {
      return chobj[fieldName] || '(inherited)'
    }
    return node.attrib && node.attrib[fieldName]
  }

  const chobj = changes[node.id!]
  let className = getClassName()
  const value = getValue()

  if (!styled) {
    return value
  }

  if (!ayonClient.settings.attributes.length) {
    return <span className={`editor-field ${className}`}>{value}</span>
  }

  // @ts-ignore: Object is possibly 'null'.
  const attribSettings = ayonClient.settings.attributes.find((el) => el.name === fieldName).data
  const fieldType = attribSettings.type

  if (fieldName === 'tools' && value) {
    return <ToolsField value={value} className={className} attrib={attribSettings} />
  }
  if (fieldType === 'datetime') {
    return <TimestampField value={value} ddOnly />
  }
  if (fieldType === 'boolean') {
    return !value ? '' : <Icon icon="check" className={`editor-field ${className}`} />
  }

  if (fieldType === 'list_of_strings' && typeof value === 'object') {
    if (!value?.length) {
      return ''
    }

    const _enum = attribSettings.enum

    const labels = _enum
      // @ts-ignore: Object is possibly 'null'.
      .filter((item: any) => value.includes(item.value))
      .map((item: any) => item.label || item.value)
    const values = _enum
      // @ts-ignore: Object is possibly 'null'.
      .filter((item: any) => value.includes(item.value))
      .map((item: any) => item.value)

    return (
      <span className={`editor-field ${className}`} title={values.join(', ')}>
        {labels.join(', ')}
      </span>
    )
  }

  // TODO uncovered case? returning empty string
  return ''
}

export { formatAttribute }
