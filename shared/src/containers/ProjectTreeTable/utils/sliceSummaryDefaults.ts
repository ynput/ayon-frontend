import type { SummaryCalc, RowScope } from '../types/summaryTypes'

const NON_COLUMN_SLICES = new Set(['hierarchy', 'entityList'])

const BUILTIN_SLICE_COLUMN: Record<string, string> = {
  status: 'status',
  assignees: 'assignees',
  taskType: 'subType',
  type: 'subType',
}

export const sliceColumnId = (sliceType?: string): string | undefined => {
  if (!sliceType || NON_COLUMN_SLICES.has(sliceType)) return undefined
  return BUILTIN_SLICE_COLUMN[sliceType] ?? `attrib_${sliceType}`
}

export const applySliceSummaryDefault = (
  columnSummaries: Record<string, SummaryCalc>,
  columnSummaryScopes: Record<string, RowScope> | undefined,
  sliceType: string | undefined,
): Record<string, SummaryCalc> => {
  const col = sliceColumnId(sliceType)
  if (!col) return columnSummaries
  const hasExplicit = columnSummaries[col] != null || columnSummaryScopes?.[col] != null
  if (hasExplicit) return columnSummaries
  return { ...columnSummaries, [col]: 'values' }
}
