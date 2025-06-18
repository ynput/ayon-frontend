import { AttributeData } from '@shared/api'

export const getTypeDefaultValue = (type: AttributeData['type']) => {
  switch (type) {
    case 'boolean':
      return false
    case 'datetime':
      return null
    case 'float':
    case 'integer':
      return 0
    case 'string':
      return ''
    case 'list_of_strings':
    case 'list_of_integers':
    case 'list_of_any':
    case 'list_of_submodels':
      return []
    case 'dict':
      return {}
    default:
      return null
  }
}
