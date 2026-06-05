import {
  ColumnSummary,
  DEFAULT_SUMMARY_FORMAT,
  formatHasCount,
  formatHasPercent,
  SummaryCalc,
  SummaryFormat,
  SummaryKind,
} from './summaryTypes'

export type EditableKind = 'number' | 'boolean' | 'text'

export const isEditableKind = (kind: SummaryKind): kind is EditableKind =>
  kind === 'number' || kind === 'boolean' || kind === 'text'

// count vs percentage applies only to filled/checked style aggregations
export const supportsFormat = (kind: EditableKind): boolean =>
  kind === 'text' || kind === 'boolean'

export const CALC_OPTIONS: Record<EditableKind, { value: SummaryCalc; label: string }[]> = {
  number: [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' },
  ],
  boolean: [
    { value: 'checked', label: 'Checked' },
    { value: 'notChecked', label: 'Not checked' },
  ],
  text: [
    { value: 'filled', label: 'Filled' },
    { value: 'notFilled', label: 'Empty' },
  ],
}

export const DEFAULT_CALC: Record<EditableKind, SummaryCalc> = {
  number: 'sum',
  boolean: 'checked',
  text: 'filled',
}

// Older persisted configs stored percentage as its own calc; now it's a format toggle.
const LEGACY_CALC: Record<string, SummaryCalc> = {
  percentFilled: 'filled',
  percentNotFilled: 'notFilled',
  percentChecked: 'checked',
  percentNotChecked: 'notChecked',
}

// 'none' was a calc option before hiding moved to the scope toggles — fall back to default
export const normalizeCalc = (calc?: SummaryCalc): SummaryCalc | undefined =>
  calc && calc !== 'none' ? LEGACY_CALC[calc as string] ?? calc : undefined

export type FormattedSummary = { label: string; count?: string; percent?: string }

// Resolve the short label + value(s) to render for an editable summary cell.
export const formatEditableSummary = (
  calc: SummaryCalc,
  summary: ColumnSummary,
  kind: EditableKind,
  format: SummaryFormat = DEFAULT_SUMMARY_FORMAT,
): FormattedSummary | null => {
  if (kind === 'number') {
    switch (calc) {
      case 'sum':
        return summary.sum !== undefined ? { label: 'sum', count: String(summary.sum) } : null
      case 'avg':
        return summary.avg !== undefined ? { label: 'avg', count: String(summary.avg) } : null
      case 'min':
        return summary.min !== undefined ? { label: 'min', count: String(summary.min) } : null
      case 'max':
        return summary.max !== undefined ? { label: 'max', count: String(summary.max) } : null
      default:
        return null
    }
  }

  const counted = (label: string, count?: number, percent?: number): FormattedSummary | null => {
    if (count == null && percent == null) return null
    const showCount = formatHasCount(format)
    const showPercent = formatHasPercent(format)
    if (!showCount && !showPercent) return null
    return {
      label,
      count: showCount ? String(count ?? 0) : undefined,
      percent: showPercent ? `${percent ?? 0}%` : undefined,
    }
  }

  switch (calc) {
    case 'checked':
      return counted('checked', summary.checkedCount, summary.percentageChecked)
    case 'notChecked':
      return counted('not checked', summary.notCheckedCount, summary.percentageNotChecked)
    case 'filled':
      return counted('filled', summary.filledCount, summary.percentageFilled)
    case 'notFilled':
      return counted('empty', summary.notFilledCount, summary.percentageNotFilled)
    default:
      return null
  }
}
