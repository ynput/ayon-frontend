import type { HTMLAttributes } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

const Value = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  .icon {
    font-size: 18px;
    user-select: none;
  }

  &.true .icon {
    color: var(--md-sys-color-tertiary);
    font-variation-settings: 'FILL' 1;
  }

  &.false .icon {
    color: var(--md-sys-color-outline);
  }
`

export interface BooleanValueProps extends HTMLAttributes<HTMLSpanElement> {
  value: boolean
}

// a read-only yes/no in a table cell: a check for true, a dim dash for false
// (an empty circle for false reads as an unchecked radio button)
export const BooleanValue = ({ value, className, ...props }: BooleanValueProps) => (
  <Value
    {...props}
    className={clsx(className, value ? 'true' : 'false')}
    role="img"
    aria-label={value ? 'Yes' : 'No'}
  >
    <Icon icon={value ? 'check_circle' : 'remove'} />
  </Value>
)
