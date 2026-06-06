export * from './table'
export * from './overviewContext'
export * from './operations'
export * from './summaryTypes'

import type { FieldStats } from '@shared/api'
import type {
  MainCountLabels,
  RowScope,
  SummaryCalc,
  SummaryFormat,
} from './summaryTypes'
import { OperationModel } from './operations'

export type AttributeEnumItem = {
  value: string | number | number | boolean
  label: string
  icon?: string
  color?: string
}

export type AttributeData = {
  /** Type of attribute value */
  type:
    | 'string'
    | 'integer'
    | 'float'
    | 'boolean'
    | 'datetime'
    | 'list_of_strings'
    | 'list_of_integers'
    | 'list_of_any'
    | 'list_of_submodels'
    | 'dict'
  /** Nice, human readable title of the attribute */
  title?: string
  description?: string
  /** Example value of the field. */
  example?: any
  /** Default value for the attribute. Do not set for list types. */
  default?: any
  gt?: number | number
  ge?: number | number
  lt?: number | number
  le?: number | number
  minLength?: number
  maxLength?: number
  /** Minimum number of items in list type. */
  minItems?: number
  /** Only for list types. Maximum number of items in the list. */
  maxItems?: number
  /** Only for string types. The value must match this regex. */
  regex?: string
  /** List of enum items used for displaying select/multiselect widgets */
  enum?: AttributeEnumItem[]
  /** Inherit the attribute value from the parent entity. */
  inherit?: boolean
}

export type AttributeModel = {
  name: string
  /** Default order */
  position: number
  /** List of entity types the attribute is available on */
  scope?: (
    | ('folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile')
    | ('project' | 'user')
  )[]
  /** Is attribute builtin. Built-in attributes cannot be removed. */
  builtin?: boolean
  data: AttributeData
}

export interface ProjectTableAttribute extends Omit<AttributeModel, 'position'> {
  readOnly?: boolean
}

export type LoadingTasks = Record<string, number> // show number of loading tasks per folder or root

export type PatchOperation = Pick<OperationModel, 'entityId' | 'entityType' | 'data'> & {
  type?: OperationModel['type']
}

interface EnumOption extends AttributeEnumItem {
  scope?: string[]
}

export type TreeTableSubType = 'folderType' | 'taskType' | 'productType'
type BuiltInFieldOptionKey = TreeTableSubType | 'status' | 'assignee' | 'tag'

export type BuiltInFieldOptions = {
  [key in BuiltInFieldOptionKey]: EnumOption[]
}

// Props contract for one summary footer cell's content, implemented by the
// powerpack `summaries/SummaryCellContent` remote module. The host owns the
// footer row structure (borders, widths, pinning); the remote renders only
// what's inside a cell. Both sides import this type — changes break the addon.
export interface SummaryCellContentProps {
  columnId: string
  attribs: ProjectTableAttribute[]
  // raw backend stats; the remote derives per-scope summaries itself
  fieldStats?: FieldStats[]
  groupFieldStats?: FieldStats[]
  calc?: SummaryCalc
  onCalcChange: (calc: SummaryCalc) => void
  format?: SummaryFormat
  onFormatChange: (format: SummaryFormat) => void
  scope?: RowScope
  onScopeChange: (scope: RowScope) => void
  mainCountLabels?: MainCountLabels
  fieldOptions?: BuiltInFieldOptions
}
