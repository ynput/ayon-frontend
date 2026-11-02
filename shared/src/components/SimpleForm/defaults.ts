import type { SimpleFormField } from '@shared/api'
import type { SimpleFormValueDict } from './types'

export const getDefaults = (
  fields: SimpleFormField[],
  values: SimpleFormValueDict,
): SimpleFormValueDict => {
  const defaults: SimpleFormValueDict = {}
  fields.forEach((field) => {
    if (field.name in values) {
      defaults[field.name] = values[field.name]
    } else if (field.value) {
      defaults[field.name] = field.value
    } else if (field.type === 'boolean') {
      defaults[field.name] = false
    } else if (field.type === 'integer') {
      defaults[field.name] = 0
    } else if (field.type === 'float') {
      defaults[field.name] = 0.0
    } else if (field.type === 'text') {
      defaults[field.name] = ''
    } else if (field.type === 'multiselect') {
      defaults[field.name] = []
    } else if (field.type === 'file') {
      defaults[field.name] = undefined
    }
  })
  return defaults
}
