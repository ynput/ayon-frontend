import { FC, useRef } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './TableFooter.styled'
import {
  DEFAULT_ROW_SCOPE,
  DEFAULT_SUMMARY_FORMAT,
  MainCountLabels,
  RowScope,
  SummaryCalc,
  SummaryFormat,
} from './summaryTypes'
import { EditableKind, CALC_OPTIONS, supportsFormat } from './calcOptions'
import { ScopeToggles, FormatToggles } from './SummaryToggles'
import { useClickOutside } from './useClickOutside'

type Props = {
  kind: EditableKind
  selected: SummaryCalc
  onSelect: (calc: SummaryCalc) => void
  format?: SummaryFormat
  onFormatChange?: (format: SummaryFormat) => void
  scope?: RowScope
  onScopeChange?: (scope: RowScope) => void
  labels: MainCountLabels
  onClose: () => void
}

export const CalcSelector: FC<Props> = ({
  kind,
  selected,
  onSelect,
  format,
  onFormatChange,
  scope,
  onScopeChange,
  labels,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, onClose)

  return (
    <Styled.Popover ref={ref} onClick={(e) => e.stopPropagation()}>
      {supportsFormat(kind) && onFormatChange && (
        <>
          <FormatToggles format={format ?? DEFAULT_SUMMARY_FORMAT} onChange={onFormatChange} />
          <Styled.SelectorDivider />
        </>
      )}

      {CALC_OPTIONS[kind].map((opt) => (
        <Styled.SelectorItem
          key={opt.value}
          className={opt.value === selected ? 'selected' : undefined}
          onClick={() => {
            onSelect(opt.value)
            onClose()
          }}
        >
          {opt.label}
          {opt.value === selected && <Icon icon="check" />}
        </Styled.SelectorItem>
      ))}

      {onScopeChange && labels.secondary && (
        <>
          <Styled.SelectorDivider />
          <ScopeToggles
            scope={scope ?? DEFAULT_ROW_SCOPE}
            onChange={onScopeChange}
            labels={labels}
          />
        </>
      )}
    </Styled.Popover>
  )
}
