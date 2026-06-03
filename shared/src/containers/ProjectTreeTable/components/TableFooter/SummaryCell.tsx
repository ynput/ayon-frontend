import { FC, useState } from 'react'
import * as Styled from './TableFooter.styled'
import { ProportionBar } from './ProportionBar'
import { CalcSelector } from './CalcSelector'
import {
  DEFAULT_CALC,
  EditableKind,
  formatEditableSummary,
  isEditableKind,
} from './calcOptions'
import { ColumnSummary, MainCountSummary, SummaryCalc, SummaryKind } from './summaryTypes'

type Props = {
  kind: SummaryKind
  summary?: ColumnSummary
  mainCount?: MainCountSummary
  calc?: SummaryCalc
  onCalcChange?: (calc: SummaryCalc) => void
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const EditableSummary: FC<{
  kind: EditableKind
  summary: ColumnSummary
  calc?: SummaryCalc
  onChange?: (calc: SummaryCalc) => void
}> = ({ kind, summary, calc, onChange }) => {
  const [open, setOpen] = useState(false)
  const effective = calc ?? DEFAULT_CALC[kind]
  const formatted = formatEditableSummary(effective, summary)

  return (
    <Styled.Clickable onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen((v) => !v)}>
      {formatted ? (
        <>
          <span className="value">{formatted.value}</span>
          <span className="label">{formatted.label}</span>
        </>
      ) : (
        <span className="label">—</span>
      )}
      {open && (
        <CalcSelector
          kind={kind}
          selected={effective}
          onSelect={(c) => onChange?.(c)}
          onClose={() => setOpen(false)}
        />
      )}
    </Styled.Clickable>
  )
}

export const SummaryCell: FC<Props> = ({ kind, summary, mainCount, calc, onCalcChange }) => {
  if (isEditableKind(kind)) {
    return summary ? (
      <EditableSummary kind={kind} summary={summary} calc={calc} onChange={onCalcChange} />
    ) : null
  }

  switch (kind) {
    case 'main':
      if (!mainCount) return null
      return (
        <Styled.CellContent>
          <span className="value">{mainCount.groups}</span>
          <span className="label">{mainCount.groupLabel}</span>
          <span className="label">|</span>
          <span className="value">{mainCount.tasks}</span>
          <span className="label">{mainCount.taskLabel}</span>
        </Styled.CellContent>
      )

    case 'datetime':
      return summary ? (
        <Styled.CellContent>
          <span className="value">{formatDate(summary.maxDate)}</span>
        </Styled.CellContent>
      ) : null

    case 'enum':
      return summary?.distribution?.length ? (
        <ProportionBar items={summary.distribution} />
      ) : null

    case 'assignee':
      return summary?.distribution?.length ? (
        <ProportionBar items={summary.distribution} />
      ) : null

    default:
      return null
  }
}
