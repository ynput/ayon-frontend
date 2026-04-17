import { AttributeData } from '@shared/api'

export type UIAttributeType = 'text' | 'select' | 'multi_select' | 'number' | 'checkbox' | 'datetime'

export interface UITypeOption {
  value: UIAttributeType
  label: string
}

export const UI_TYPE_OPTIONS: UITypeOption[] = [
  { value: 'text', label: 'Text' },
  { value: 'select', label: 'Select' },
  { value: 'multi_select', label: 'Multi-select' },
  { value: 'number', label: 'Number' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'datetime', label: 'Date and time' },
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

export const getUiTypeLabel = (
  type: AttributeData['type'] | undefined,
  enumValues?: AttributeData['enum'],
): string => {
  const uiType = backendToUiType(type, enumValues)
  return UI_TYPE_OPTIONS.find((o) => o.value === uiType)?.label ?? type ?? ''
}