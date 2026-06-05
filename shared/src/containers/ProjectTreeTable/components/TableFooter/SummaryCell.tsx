import { FC, useRef, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './TableFooter.styled'
import { ProportionBar } from './ProportionBar'
import { SummaryBreakdown } from './SummaryBreakdown'
import { CalcSelector } from './CalcSelector'
import { ScopeToggles } from './SummaryToggles'
import { useClickOutside } from './useClickOutside'
import { useHoverClose } from './useHoverClose'
import {
  DEFAULT_CALC,
  EditableKind,
  formatEditableSummary,
  isEditableKind,
  normalizeCalc,
} from './calcOptions'
import {
  ColumnSummary,
  DEFAULT_MAIN_COUNT_LABELS,
  DEFAULT_ROW_SCOPE,
  DEFAULT_SUMMARY_FORMAT,
  EnumCalc,
  MainCountLabels,
  RowScope,
  scopeHasGroups,
  scopeHasRows,
  SummaryCalc,
  SummaryDistributionItem,
  SummaryFormat,
  SummaryKind,
} from './summaryTypes'

type Props = {
  kind: SummaryKind
  summary?: ColumnSummary
  calc?: SummaryCalc
  onCalcChange?: (calc: SummaryCalc) => void
  format?: SummaryFormat
  onFormatChange?: (format: SummaryFormat) => void
  scope?: RowScope
  onScopeChange?: (scope: RowScope) => void
  mainCountLabels?: MainCountLabels
  // false for always-filled enums (status, type, priority): no Filled & empty mode
  allowFillMode?: boolean
}

const EditableSummary: FC<{
  kind: EditableKind
  summary: ColumnSummary
  calc?: SummaryCalc
  onChange?: (calc: SummaryCalc) => void
  format?: SummaryFormat
  onFormatChange?: (format: SummaryFormat) => void
  scope: RowScope
  onScopeChange?: (scope: RowScope) => void
  labels: MainCountLabels
}> = ({ kind, summary, calc, onChange, format, onFormatChange, scope, onScopeChange, labels }) => {
  const [open, setOpen] = useState(false)
  const effectiveCalc = normalizeCalc(calc) ?? DEFAULT_CALC[kind]
  const effectiveFormat = format ?? DEFAULT_SUMMARY_FORMAT
  const formatted =
    scope === 'none' ? null : formatEditableSummary(effectiveCalc, summary, kind, effectiveFormat)

  const { cancelClose, scheduleClose } = useHoverClose(() => setOpen(false))

  return (
    <Styled.Clickable
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={cancelClose}
      onMouseLeave={() => open && scheduleClose()}
    >
      {formatted ? (
        <>
          {formatted.count != null && <span className="value">{formatted.count}</span>}
          {formatted.count == null && formatted.percent != null && (
            <span className="value">{formatted.percent}</span>
          )}
          <span className="label">{formatted.label}</span>
          {formatted.count != null && formatted.percent != null && (
            <span className="label">({formatted.percent})</span>
          )}
        </>
      ) : (
        <span className="label">—</span>
      )}
      {open && (
        <CalcSelector
          kind={kind}
          selected={effectiveCalc}
          onSelect={(c) => onChange?.(c)}
          format={effectiveFormat}
          onFormatChange={onFormatChange}
          scope={scope}
          onScopeChange={onScopeChange}
          labels={labels}
          onClose={() => setOpen(false)}
        />
      )}
    </Styled.Clickable>
  )
}

const MainCountCell: FC<{
  summary: ColumnSummary
  labels: MainCountLabels
  scope: RowScope
  onScopeChange?: (scope: RowScope) => void
}> = ({ summary, labels, scope, onScopeChange }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false), open)
  const { cancelClose, scheduleClose } = useHoverClose(() => setOpen(false))

  const primary = summary.primaryCount ?? summary.total ?? summary.filledCount
  const secondary = summary.secondaryCount

  // Single-type table (e.g. Lists): one static count, no scope toggles.
  if (!labels.secondary) {
    const count = primary ?? secondary
    if (count == null) return null
    return (
      <Styled.CellContent>
        <span className="value">{count}</span>
        <span className="label">{labels.primary}</span>
      </Styled.CellContent>
    )
  }

  if (primary == null && secondary == null) return null

  const showPrimary = scopeHasGroups(scope) && primary != null
  const showSecondary = scopeHasRows(scope) && secondary != null

  return (
    <Styled.Clickable
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={cancelClose}
      onMouseLeave={() => open && scheduleClose()}
    >
      {showPrimary && (
        <>
          <span className="value">{primary}</span>
          <span className="label">{labels.primary}</span>
        </>
      )}
      {showPrimary && showSecondary && <span className="label">|</span>}
      {showSecondary && (
        <>
          <span className="value">{secondary}</span>
          <span className="label">{labels.secondary}</span>
        </>
      )}
      {!showPrimary && !showSecondary && <span className="label">—</span>}
      {open && (
        <Styled.Popover ref={ref} onClick={(e) => e.stopPropagation()}>
          {/* single fixed aggregation, shown for consistency with other columns */}
          <Styled.SelectorItem className="selected">
            Count
            <Icon icon="check" />
          </Styled.SelectorItem>
          <Styled.SelectorDivider />
          <ScopeToggles scope={scope} onChange={(s) => onScopeChange?.(s)} labels={labels} />
        </Styled.Popover>
      )}
    </Styled.Clickable>
  )
}

const FILLED_COLOR = 'var(--md-sys-color-primary)'
const EMPTY_COLOR = 'var(--md-sys-color-surface-container-highest)'

const ENUM_MODE_OPTIONS: { value: EnumCalc; label: string }[] = [
  { value: 'values', label: 'Value breakdown' },
  { value: 'fill', label: 'Filled & empty' },
]

const EnumSummaryCell: FC<{
  summary?: ColumnSummary
  calc?: SummaryCalc
  onCalcChange?: (calc: SummaryCalc) => void
  scope: RowScope
  onScopeChange?: (scope: RowScope) => void
  labels: MainCountLabels
  allowFillMode: boolean
}> = ({ summary, calc, onCalcChange, scope, onScopeChange, labels, allowFillMode }) => {
  // hover = read-only breakdown, click = configuration
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false), open)
  const { cancelClose, scheduleClose } = useHoverClose(() => setOpen(false))
  // separate timer so the hover breakdown survives the gap onto the popover
  // (it's scrollable for long value lists)
  const hoverClose = useHoverClose(() => setHovered(false))

  const distribution = summary?.distribution ?? []
  const hasDistribution = distribution.length > 0
  // one distribution at a time: value breakdown by default, filled/empty on demand
  const mode: EnumCalc =
    (calc === 'fill' && allowFillMode) || !hasDistribution ? 'fill' : 'values'

  const fillItems: SummaryDistributionItem[] = []
  if (summary?.filledCount != null)
    fillItems.push({
      value: '__filled__',
      label: 'Filled',
      count: summary.filledCount,
      color: FILLED_COLOR,
    })
  if (summary?.notFilledCount != null)
    fillItems.push({
      value: '__empty__',
      label: 'Empty',
      count: summary.notFilledCount,
      color: EMPTY_COLOR,
    })

  const items =
    mode === 'values' ? [...distribution].sort((a, b) => b.count - a.count) : fillItems
  const total = items.reduce((a, i) => a + i.count, 0)
  const showBar = scope !== 'none' && total > 0

  // which aggregations apply here; a single entry still renders as an info row
  const modeOptions = ENUM_MODE_OPTIONS.filter((opt) =>
    opt.value === 'values' ? hasDistribution : allowFillMode || !hasDistribution,
  )
  const hasModeOptions = modeOptions.length > 0 && !!onCalcChange
  const hasScopeToggles = !!onScopeChange && !!labels.secondary
  const hasConfig = hasModeOptions || hasScopeToggles

  return (
    <Styled.Clickable
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => hasConfig && setOpen((v) => !v)}
      onMouseEnter={() => {
        setHovered(true)
        hoverClose.cancelClose()
        cancelClose()
      }}
      onMouseLeave={() => {
        hoverClose.scheduleClose()
        if (open) scheduleClose()
      }}
    >
      {showBar ? <ProportionBar items={items} /> : <span className="label">—</span>}
      {hovered && !open && items.length > 0 && (
        <Styled.Popover
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <SummaryBreakdown items={items} total={total} />
        </Styled.Popover>
      )}
      {open && (
        <Styled.Popover ref={ref} onClick={(e) => e.stopPropagation()}>
          {hasModeOptions && (
            <>
              {modeOptions.map((opt) => (
                <Styled.SelectorItem
                  key={opt.value}
                  className={opt.value === mode ? 'selected' : undefined}
                  onClick={() => onCalcChange?.(opt.value)}
                >
                  {opt.label}
                  {opt.value === mode && <Icon icon="check" />}
                </Styled.SelectorItem>
              ))}
            </>
          )}
          {hasModeOptions && hasScopeToggles && <Styled.SelectorDivider />}
          {hasScopeToggles && (
            <ScopeToggles scope={scope} onChange={onScopeChange!} labels={labels} />
          )}
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
  format,
  onFormatChange,
  scope,
  onScopeChange,
  mainCountLabels = DEFAULT_MAIN_COUNT_LABELS,
  allowFillMode = true,
}) => {
  const effectiveScope = scope ?? DEFAULT_ROW_SCOPE

  if (isEditableKind(kind)) {
    return summary ? (
      <EditableSummary
        kind={kind}
        summary={summary}
        calc={calc}
        onChange={onCalcChange}
        format={format}
        onFormatChange={onFormatChange}
        scope={effectiveScope}
        onScopeChange={onScopeChange}
        labels={mainCountLabels}
      />
    ) : null
  }

  switch (kind) {
    case 'main':
      return summary ? (
        <MainCountCell
          summary={summary}
          labels={mainCountLabels}
          scope={effectiveScope}
          onScopeChange={onScopeChange}
        />
      ) : null

    case 'enum':
    case 'assignee':
      return (
        <EnumSummaryCell
          summary={summary}
          calc={calc}
          onCalcChange={onCalcChange}
          scope={effectiveScope}
          onScopeChange={onScopeChange}
          labels={mainCountLabels}
          allowFillMode={allowFillMode}
        />
      )

    default:
      return null
  }
}
