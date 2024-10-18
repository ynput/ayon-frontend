import { AttributeModel } from '@api/rest/attributes'

export type FilterValue = {
  id: string
  label: string
  img?: string | null
  icon?: string | null
  color?: string | null
  isCustom?: boolean
  parentId?: string | null
}

export type Filter = {
  id: string
  type?: AttributeModel['data']['type']
  label: string
  inverted?: boolean
  icon?: string | null
  img?: string | null
  values?: FilterValue[]
  isCustom?: boolean
  singleSelect?: boolean
  fieldType?: string
}

export interface Option extends Filter {
  allowNoValue?: boolean
  allowHasValue?: boolean
  allowsCustomValues?: boolean
  color?: string | null
  parentId?: string | null
}
