import { FC, useEffect, useRef } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './TableFooter.styled'
import { SummaryCalc } from './summaryTypes'
import { EditableKind, CALC_OPTIONS } from './calcOptions'

type Props = {
  kind: EditableKind
  selected: SummaryCalc
  onSelect: (calc: SummaryCalc) => void
  onClose: () => void
}

export const CalcSelector: FC<Props> = ({ kind, selected, onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  return (
    <Styled.Popover ref={ref}>
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
    </Styled.Popover>
  )
}
