import type { FieldType } from './AttribForm'

export const getDefaultFromType = (type: FieldType): any => {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []

    default:
      return undefined
  }
}
