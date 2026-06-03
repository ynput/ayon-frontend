export type SummaryKind =
  | 'main'
  | 'number'
  | 'boolean'
  | 'text'
  | 'datetime'
  | 'enum'
  | 'assignee'
  | 'blank'

export type NumberCalc = 'sum' | 'avg' | 'min' | 'max' | 'none'
export type BooleanCalc = 'checked' | 'notChecked' | 'percentChecked' | 'percentNotChecked'

export type SummaryCalc = NumberCalc | BooleanCalc | 'filled'

// Which rows feed the aggregation: 'all' = groups/folders + tasks, 'tasks' = tasks only.
export type RowScope = 'all' | 'tasks'
export const DEFAULT_ROW_SCOPE: RowScope = 'tasks'

export type SummaryDistributionItem = {
  value: string
  label?: string
  color?: string
  icon?: string
  avatarUrl?: string
  fullName?: string
  count: number
}

// Mirrors backend ColumnStats (ayon-backend PR #943) plus the distribution +
// sum fields requested in the column-summary aggregations handoff.
export type ColumnSummary = {
  columnId: string

  filledCount?: number
  notFilledCount?: number
  percentageFilled?: number
  percentageNotFilled?: number

  checkedCount?: number
  notCheckedCount?: number
  percentageChecked?: number
  percentageNotChecked?: number

  sum?: number
  avg?: number
  min?: number
  max?: number

  minDate?: string
  maxDate?: string

  distribution?: SummaryDistributionItem[]
  total?: number

  // main/count column: separate folder and task (or product/version) totals
  folderCount?: number
  taskCount?: number
}

// The main/label column shows a dual count whose left label depends on the mode.
export type MainCountSummary = {
  groups: number
  tasks: number
  groupLabel: string
  taskLabel: string
}

export type ColumnSummaryMap = Record<string, ColumnSummary>
