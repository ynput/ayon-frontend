import { ColumnSummary, SummaryCalc, SummaryKind } from './summaryTypes'

export type EditableKind = 'number' | 'boolean' | 'text' | 'datetime'

export const isEditableKind = (kind: SummaryKind): kind is EditableKind =>
  kind === 'number' || kind === 'boolean' || kind === 'text' || kind === 'datetime'

export const CALC_OPTIONS: Record<EditableKind, { value: SummaryCalc; label: string }[]> = {
  number: [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
    { value: 'none', label: 'None' },
  ],
  boolean: [
    { value: 'checked', label: 'Checked' },
    { value: 'notChecked', label: 'Not checked' },
    { value: 'percentChecked', label: '% checked' },
    { value: 'percentNotChecked', label: '% not checked' },
    { value: 'none', label: 'None' },
  ],
  text: [
    { value: 'filled', label: 'Filled' },
    { value: 'notFilled', label: 'Empty' },
    { value: 'percentFilled', label: '% filled' },
    { value: 'percentNotFilled', label: '% empty' },
    { value: 'none', label: 'None' },
  ],
  datetime: [
    { value: 'min', label: 'Earliest' },
    { value: 'max', label: 'Latest' },
    { value: 'none', label: 'None' },
  ],
}

export const DEFAULT_CALC: Record<EditableKind, SummaryCalc> = {
  number: 'sum',
  boolean: 'checked',
  text: 'filled',
  datetime: 'max',
}

const formatDate = (iso?: string): string | null => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Resolve the short label + value to render for an editable summary cell.
export const formatEditableSummary = (
  calc: SummaryCalc,
  summary: ColumnSummary,
  kind: EditableKind,
): { label: string; value: string } | null => {
  if (kind === 'datetime') {
    if (calc === 'min') {
      const date = formatDate(summary.minDate)
      return date ? { label: 'earliest', value: date } : null
    }
    if (calc === 'max') {
      const date = formatDate(summary.maxDate)
      return date ? { label: 'latest', value: date } : null
    }
    return null
  }

  switch (calc) {
    case 'none':
      return null
    case 'sum':
      return summary.sum !== undefined ? { label: 'sum', value: String(summary.sum) } : null
    case 'avg':
      return summary.avg !== undefined ? { label: 'avg', value: String(summary.avg) } : null
    case 'min':
      return summary.min !== undefined ? { label: 'min', value: String(summary.min) } : null
    case 'max':
      return summary.max !== undefined ? { label: 'max', value: String(summary.max) } : null
    case 'checked':
      return { label: 'checked', value: String(summary.checkedCount ?? 0) }
    case 'notChecked':
      return { label: 'not checked', value: String(summary.notCheckedCount ?? 0) }
    case 'percentChecked':
      return { label: 'checked', value: `${summary.percentageChecked ?? 0}%` }
    case 'percentNotChecked':
      return { label: 'not checked', value: `${summary.percentageNotChecked ?? 0}%` }
    case 'filled':
      return { label: 'filled', value: String(summary.filledCount ?? 0) }
    case 'notFilled':
      return { label: 'empty', value: String(summary.notFilledCount ?? 0) }
    case 'percentFilled':
      return { label: 'filled', value: `${summary.percentageFilled ?? 0}%` }
    case 'percentNotFilled':
      return { label: 'empty', value: `${summary.percentageNotFilled ?? 0}%` }
    default:
      return null
  }
}
