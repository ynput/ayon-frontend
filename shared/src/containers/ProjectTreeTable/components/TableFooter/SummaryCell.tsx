import { FC, useState } from 'react'
import { AssigneeField } from '@ynput/ayon-react-components'
import * as Styled from './TableFooter.styled'
import { ProportionBar } from './ProportionBar'
import { SummaryBreakdown } from './SummaryBreakdown'
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

const AssigneeSummary: FC<{ summary: ColumnSummary }> = ({ summary }) => {
  const [open, setOpen] = useState(false)
  const items = summary.distribution || []
  const total = summary.total || items.reduce((a, i) => a + i.count, 0)
  if (!items.length) return null
  const users = items.map((i) => ({ name: i.value, fullName: i.fullName, avatarUrl: i.avatarUrl }))
  return (
    <Styled.Clickable onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen((v) => !v)}>
      <AssigneeField users={users} />
      {open && <SummaryBreakdown items={items} total={total} onClose={() => setOpen(false)} />}
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
      return summary ? <AssigneeSummary summary={summary} /> : null

    default:
      return null
  }
}
