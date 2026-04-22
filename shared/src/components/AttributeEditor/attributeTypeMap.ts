import { AttributeData } from '@shared/api'
import { getAttributeIcon } from '@shared/util'

export type UIAttributeType =
  | 'text'
  | 'select'
  | 'multi_select'
  | 'number'
  | 'checkbox'
  | 'datetime'

export interface UITypeOption {
  value: UIAttributeType
  label: string
  icon: string
}

export const UI_TYPE_OPTIONS: UITypeOption[] = [
  { value: 'text', label: 'Text', icon: getAttributeIcon('text', 'string') },
  { value: 'select', label: 'Select', icon: getAttributeIcon('select', 'string', true) },
  {
    value: 'multi_select',
    label: 'Multi-select',
    icon: getAttributeIcon('multi_select', 'list_of_strings', true),
  },
  { value: 'number', label: 'Number', icon: getAttributeIcon('number', 'integer') },
  { value: 'checkbox', label: 'Checkbox', icon: getAttributeIcon('checkbox', 'boolean') },
  { value: 'datetime', label: 'Date and time', icon: getAttributeIcon('datetime', 'datetime') },
]

export const UI_TYPE_FIELDS: Record<UIAttributeType, (keyof AttributeData)[]> = {
  text: ['minLength', 'maxLength', 'regex'],
  select: ['enum'],
  multi_select: ['enum', 'minItems', 'maxItems'],
  number: ['ge', 'gt', 'le', 'lt'],
  checkbox: [],
  datetime: [],
}

export const UI_TYPE_EXCLUDE: Partial<Record<UIAttributeType, (keyof AttributeData)[]>> = {
  checkbox: ['example'],
}

export const backendToUiType = (
  type: AttributeData['type'] | undefined,
  enumValues?: AttributeData['enum'],
): UIAttributeType => {
  switch (type) {
    case 'string':
      return enumValues?.length ? 'select' : 'text'
    case 'list_of_strings':
      return 'multi_select'
    case 'integer':
    case 'float':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'datetime':
      return 'datetime'
    default:
      return 'text'
  }
}

export const uiTypeToBackend = (
  uiType: UIAttributeType,
  isDecimal: boolean,
): AttributeData['type'] => {
  switch (uiType) {
    case 'text':
      return 'string'
    case 'select':
      return 'string'
    case 'multi_select':
      return 'list_of_strings'
    case 'number':
      return isDecimal ? 'float' : 'integer'
    case 'checkbox':
      return 'boolean'
    case 'datetime':
      return 'datetime'
  }
}

const UI_MAPPED_BACKEND_TYPES: ReadonlyArray<AttributeData['type']> = [
  'string',
  'integer',
  'float',
  'boolean',
  'datetime',
  'list_of_strings',
]

export const getUiTypeLabel = (
  type: AttributeData['type'] | undefined,
  enumValues?: AttributeData['enum'],
): string => {
  // Unknown / unsupported backend types fall back to the raw type string
  // so the table doesn't mislabel them (e.g. list_of_integers, dict).
  if (!type || !UI_MAPPED_BACKEND_TYPES.includes(type)) return type ?? ''
  const uiType = backendToUiType(type, enumValues)
  return UI_TYPE_OPTIONS.find((o) => o.value === uiType)?.label ?? type
}
