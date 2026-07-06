export type SummaryKind = 'main' | 'number' | 'boolean' | 'text' | 'enum' | 'assignee' | 'blank'

export type NumberCalc = 'sum' | 'avg' | 'min' | 'max' | 'none'
export type BooleanCalc = 'checked' | 'notChecked'
export type TextCalc = 'filled' | 'notFilled'
// enum bar mode: value distribution vs filled/empty split
export type EnumCalc = 'values' | 'fill'

export type SummaryCalc = NumberCalc | BooleanCalc | TextCalc | EnumCalc

// Display format for count-style summaries, driven by the Count/Percentage toggles.
export type SummaryFormat = 'count' | 'percent' | 'both' | 'none'
export const DEFAULT_SUMMARY_FORMAT: SummaryFormat = 'count'

export const formatHasCount = (f: SummaryFormat): boolean => f === 'count' || f === 'both'
export const formatHasPercent = (f: SummaryFormat): boolean => f === 'percent' || f === 'both'
export const buildSummaryFormat = (count: boolean, percent: boolean): SummaryFormat =>
  count && percent ? 'both' : count ? 'count' : percent ? 'percent' : 'none'

export type RowScope = 'all' | 'primary' | 'secondary' | 'none'
export const DEFAULT_ROW_SCOPE: RowScope = 'all'

export const scopeHasGroups = (s: RowScope): boolean => s === 'all' || s === 'primary'
export const scopeHasRows = (s: RowScope): boolean => s === 'all' || s === 'secondary'
export const buildRowScope = (groups: boolean, rows: boolean): RowScope =>
  groups && rows ? 'all' : groups ? 'primary' : rows ? 'secondary' : 'none'

// Labels for the main/count cell's dual count. Defaults to folders/tasks (Overview);
// Versions/Products page overrides with products/versions.
export type MainCountLabels = {
  primary: string
  secondary?: string
}

export const DEFAULT_MAIN_COUNT_LABELS: MainCountLabels = {
  primary: 'folders',
  secondary: 'tasks',
}
