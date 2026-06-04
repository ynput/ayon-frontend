import { FC, useEffect, useRef, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
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
import {
  ColumnSummary,
  DEFAULT_MAIN_COUNT_LABELS,
  MainCountLabels,
  RowScope,
  SummaryCalc,
  SummaryDistributionItem,
  SummaryKind,
} from './summaryTypes'

type Props = {
  kind: SummaryKind
  summary?: ColumnSummary
  calc?: SummaryCalc
  onCalcChange?: (calc: SummaryCalc) => void
  scope?: RowScope
  onScopeChange?: (scope: RowScope) => void
  mainCountLabels?: MainCountLabels
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
  const formatted = formatEditableSummary(effective, summary, kind)

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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const MainCountCell: FC<{ summary: ColumnSummary; labels: MainCountLabels }> = ({
  summary,
  labels,
}) => {
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

  // Single-type table (e.g. Lists): one static count, no dual toggle.
  if (!labels.secondary) {
    const count = folders ?? tasks
    if (count == null) return null
    return (
      <Styled.CellContent>
        <span className="value">{count}</span>
        <span className="label">{labels.primary}</span>
      </Styled.CellContent>
    )
  }

  if (folders == null && tasks == null) return null

  const mainOptions: { value: MainMode; label: string }[] = [
    { value: 'both', label: `${cap(labels.primary)} & ${cap(labels.secondary)}` },
    { value: 'folders', label: cap(labels.primary) },
    { value: 'tasks', label: cap(labels.secondary) },
  ]

  const showFolders = (mode === 'both' || mode === 'folders') && folders != null
  const showTasks = (mode === 'both' || mode === 'tasks') && tasks != null

  return (
    <Styled.Clickable onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen((v) => !v)}>
      {showFolders && (
        <>
          <span className="value">{folders}</span>
          <span className="label">{labels.primary}</span>
        </>
      )}
      {showFolders && showTasks && <span className="label">|</span>}
      {showTasks && (
        <>
          <span className="value">{tasks}</span>
          <span className="label">{labels.secondary}</span>
        </>
      )}
      {open && (
        <Styled.Popover ref={ref} onClick={(e) => e.stopPropagation()}>
          {mainOptions.map((opt) => (
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

const EnumSummaryCell: FC<{ summary?: ColumnSummary }> = ({ summary }) => {
  const [open, setOpen] = useState(false)

  if (summary?.distribution?.length) return <ProportionBar items={summary.distribution} />

  const filled = summary?.filledCount
  const notFilled = summary?.notFilledCount
  const total = summary?.total

  const items: SummaryDistributionItem[] = []
  if (filled != null) {
    items.push({
      value: '__filled__',
      label: 'Filled',
      count: filled,
      color: 'var(--md-sys-color-primary)',
    })
  }
  if (notFilled != null) {
    items.push({
      value: '__empty__',
      label: 'Empty',
      count: notFilled,
      color: 'var(--md-sys-color-surface-container-highest)',
    })
  }

  return (
    <Styled.Clickable onMouseDown={(e) => e.stopPropagation()} onClick={() => setOpen((v) => !v)}>
      {filled != null ? (
        <>
          <span className="value">{filled}</span>
          {total != null && <span className="label">/ {total}</span>}
        </>
      ) : (
        <span className="label">—</span>
      )}
      {open &&
        (items.length ? (
          <SummaryBreakdown
            items={items}
            total={(filled ?? 0) + (notFilled ?? 0)}
            onClose={() => setOpen(false)}
          />
        ) : (
          <Styled.Popover onClick={(e) => e.stopPropagation()}>
            <Styled.BreakdownItem>
              <span className="name">No data yet</span>
            </Styled.BreakdownItem>
          </Styled.Popover>
        ))}
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
  mainCountLabels = DEFAULT_MAIN_COUNT_LABELS,
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
      return summary ? <MainCountCell summary={summary} labels={mainCountLabels} /> : null

    case 'enum':
    case 'assignee':
      return <EnumSummaryCell summary={summary} />

    default:
      return null
  }
}
