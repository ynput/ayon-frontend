export * from './table'
export * from './overviewContext'
export * from './operations'
export * from './summaryTypes'

import type { FieldStats } from '@shared/api'
import type { MainCountLabels, RowScope, SummaryCalc, SummaryFormat } from './summaryTypes'
import { AttributeModel, EnumItem } from '@shared/api'
import { OperationModel } from './operations'

export interface ProjectTableAttribute extends Omit<AttributeModel, 'position'> {
  readOnly?: boolean
}

export type LoadingTasks = Record<string, number> // show number of loading tasks per folder or root

export type SoftErrorAction = {
  label: string
  icon: string
  callback: () => void
}

export type PatchOperation = Pick<OperationModel, 'entityId' | 'entityType' | 'data'> & {
  type?: OperationModel['type']
}

interface EnumOption extends EnumItem {
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
  // false when no parent entity (folder/product) is on screen; addon hides + disables the parent scope
  parentScopeApplicable?: boolean
  // unique entity rows in the current selection; addon shows "N selected" in the main count cell
  selectedCount?: number
}
