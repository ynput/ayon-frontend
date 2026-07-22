import type { SummaryCalc, RowScope } from '../types/summaryTypes'

const NON_COLUMN_SLICES = new Set(['hierarchy', 'entityList'])

// attribute slices arrive as `attrib.<name>`; the table column id is `attrib_<name>`
const ATTRIB_SLICE_PREFIX = 'attrib.'

// The unified subType column means different things per entity, so the slice that
// feeds it differs: task/folder type on the overview, product type on products.
const TASK_SUBTYPE_SLICES = new Set(['taskType', 'type'])
const PRODUCT_SUBTYPE_SLICES = new Set(['productType'])

const BUILTIN_SLICE_COLUMN: Record<string, string> = {
  status: 'status',
  assignees: 'assignees',
}

const isProductScope = (scopes?: string[]): boolean =>
  !!scopes?.some((s) => s === 'product' || s === 'version')

export const sliceColumnId = (sliceType?: string, scopes?: string[]): string | undefined => {
  if (!sliceType || NON_COLUMN_SLICES.has(sliceType)) return undefined
  if (sliceType.startsWith(ATTRIB_SLICE_PREFIX)) {
    return `attrib_${sliceType.slice(ATTRIB_SLICE_PREFIX.length)}`
  }
  const subTypeSlices = isProductScope(scopes) ? PRODUCT_SUBTYPE_SLICES : TASK_SUBTYPE_SLICES
  if (subTypeSlices.has(sliceType)) return 'subType'
  return BUILTIN_SLICE_COLUMN[sliceType]
}

export const applySliceSummaryDefault = (
  columnSummaries: Record<string, SummaryCalc>,
  columnSummaryScopes: Record<string, RowScope> | undefined,
  sliceType: string | undefined,
  scopes?: string[],
): Record<string, SummaryCalc> => {
  const col = sliceColumnId(sliceType, scopes)
  if (!col) return columnSummaries
  const hasExplicit = columnSummaries[col] != null || columnSummaryScopes?.[col] != null
  if (hasExplicit) return columnSummaries
  return { ...columnSummaries, [col]: 'values' }
}
