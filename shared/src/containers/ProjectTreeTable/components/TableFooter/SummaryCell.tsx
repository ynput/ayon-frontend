import { FC, useEffect, useRef, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './TableFooter.styled'
import { ProportionBar } from './ProportionBar'
import { CalcSelector } from './CalcSelector'
import {
  DEFAULT_CALC,
  EditableKind,
  formatEditableSummary,
  isEditableKind,
} from './calcOptions'
import { ColumnSummary, RowScope, SummaryCalc, SummaryKind } from './summaryTypes'

type Props = {
  kind: SummaryKind
  summary?: ColumnSummary
  calc?: SummaryCalc
  onCalcChange?: (calc: SummaryCalc) => void
  scope?: RowScope
  onScopeChange?: (scope: RowScope) => void
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
  scope?: RowScope
  onScopeChange?: (scope: RowScope) => void
}> = ({ kind, summary, calc, onChange, scope, onScopeChange }) => {
  const [open, setOpen] = useState(false)
  const effective = calc ?? DEFAULT_CALC[kind]
  const formatted = formatEditableSummary(effective, summary)

  // Close on mouse-leave like a normal dropdown. A grace delay bridges the small
  // gap between the trigger and the popover so moving onto the menu doesn't close it.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 250)
  }
  useEffect(() => cancelClose, [])

  return (
    <Styled.Clickable
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={cancelClose}
      onMouseLeave={() => open && scheduleClose()}
    >
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
          scope={scope}
          onScopeChange={onScopeChange}
          onClose={() => setOpen(false)}
        />
      )}
    </Styled.Clickable>
  )
}

type MainMode = 'both' | 'folders' | 'tasks'
const MAIN_OPTIONS: { value: MainMode; label: string }[] = [
  { value: 'both', label: 'Folders & Tasks' },
  { value: 'folders', label: 'Folders' },
  { value: 'tasks', label: 'Tasks' },
]

const MainCountCell: FC<{ summary: ColumnSummary }> = ({ summary }) => {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<MainMode>('both')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const folders = summary.folderCount ?? summary.total ?? summary.filledCount
  const tasks = summary.taskCount
  if (folders == null && tasks == null) return null

  const showFolders = (mode === 'both' || mode === 'folders') && folders != null
  const showTasks = (mode === 'both' || mode === 'tasks') && tasks != null

  return (
    <Styled.Clickable onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen((v) => !v)}>
      {showFolders && (
        <>
          <span className="value">{folders}</span>
          <span className="label">folders</span>
        </>
      )}
      {showFolders && showTasks && <span className="label">|</span>}
      {showTasks && (
        <>
          <span className="value">{tasks}</span>
          <span className="label">tasks</span>
        </>
      )}
      {open && (
        <Styled.Popover ref={ref} onClick={(e) => e.stopPropagation()}>
          {MAIN_OPTIONS.map((opt) => (
            <Styled.SelectorItem
              key={opt.value}
              className={opt.value === mode ? 'selected' : undefined}
              onClick={() => {
                setMode(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
              {opt.value === mode && <Icon icon="check" />}
            </Styled.SelectorItem>
          ))}
        </Styled.Popover>
      )}
    </Styled.Clickable>
  )
}

export const SummaryCell: FC<Props> = ({
  kind,
  summary,
  calc,
  onCalcChange,
  scope,
  onScopeChange,
}) => {
  if (isEditableKind(kind)) {
    return summary ? (
      <EditableSummary
        kind={kind}
        summary={summary}
        calc={calc}
        onChange={onCalcChange}
        scope={scope}
        onScopeChange={onScopeChange}
      />
    ) : null
  }

  switch (kind) {
    case 'main':
      return summary ? <MainCountCell summary={summary} /> : null

    case 'datetime':
      return summary ? (
        <Styled.CellContent>
          <span className="value">{formatDate(summary.maxDate)}</span>
        </Styled.CellContent>
      ) : null

    case 'enum':
      // needs backend group-by-value distribution; blank until then
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
