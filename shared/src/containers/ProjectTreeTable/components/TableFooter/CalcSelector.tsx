import { FC, useEffect, useRef } from 'react'
import { Icon, InputSwitch } from '@ynput/ayon-react-components'
import * as Styled from './TableFooter.styled'
import { RowScope, SummaryCalc, DEFAULT_ROW_SCOPE } from './summaryTypes'
import { EditableKind, CALC_OPTIONS } from './calcOptions'

type Props = {
  kind: EditableKind
  selected: SummaryCalc
  onSelect: (calc: SummaryCalc) => void
  scope?: RowScope
  onScopeChange?: (scope: RowScope) => void
  onClose: () => void
}

export const CalcSelector: FC<Props> = ({
  kind,
  selected,
  onSelect,
  scope,
  onScopeChange,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const effectiveScope = scope ?? DEFAULT_ROW_SCOPE
  const includesGroups = effectiveScope === 'all'

  return (
    <Styled.Popover ref={ref} onClick={(e) => e.stopPropagation()}>
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

      {onScopeChange && (
        <>
          <Styled.SelectorDivider />
          <Styled.ScopeToggleRow>
            <span>Include groups & folders</span>
            <InputSwitch
              checked={includesGroups}
              onChange={(e) =>
                onScopeChange((e.target as HTMLInputElement).checked ? 'all' : 'tasks')
              }
            />
          </Styled.ScopeToggleRow>
        </>
      )}
    </Styled.Popover>
  )
}
