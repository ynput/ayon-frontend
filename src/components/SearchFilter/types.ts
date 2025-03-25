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

export type FilterOperator = 'AND' | 'OR'

export type Filter = {
  id: string
  type?: AttributeModel['data']['type']
  label: string
  inverted?: boolean
  operator?: FilterOperator
  icon?: string | null
  img?: string | null
  values?: FilterValue[]
  isCustom?: boolean
  isReadonly?: boolean // can not be edited and only removed
  singleSelect?: boolean
  fieldType?: string
}

export interface Option extends Filter {
  allowNoValue?: boolean // allows the filter to have "no value"
  allowHasValue?: boolean // allows the filter to have "has a value"
  allowsCustomValues?: boolean // allows the filter to have custom values
  allowExcludes?: boolean // allows the filter to be inverted
  operatorChangeable?: boolean // allows the operator to be changed
  color?: string | null // color of the filter (not used for root options)
  parentId?: string | null // parent filter id
}
