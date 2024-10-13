import { forwardRef } from 'react'
import { FilterValue } from './types'
import styled from 'styled-components'
import { Icon, theme } from '@ynput/ayon-react-components'
import clsx from 'clsx'

const ValueChip = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  img {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  /* hide label */
  &.compact {
    .label {
      display: none;
    }
  }
`

const Operator = styled.span`
  ${theme.labelSmall}
  display: flex;
  align-items: center;
`

interface SearchFilterItemValueProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'id'>,
    FilterValue {
  showOperator?: boolean
  isCompact?: boolean
  parentId?: string
}

export const SearchFilterItemValue = forwardRef<HTMLDivElement, SearchFilterItemValueProps>(
  ({ value, label, img, icon, showOperator, color, isCompact, parentId, ...props }, ref) => {
    const colorStyle = color ? color : 'var(--md-sys-color-on-surface)'

    return (
      <>
        {showOperator && <Operator>or</Operator>}
        <ValueChip {...props} ref={ref} className={clsx({ compact: isCompact })}>
          {icon && (
            <Icon
              icon={icon}
              style={{
                color: colorStyle,
              }}
            />
          )}
          {img && <img src={img} alt={label} />}
          <span
            className="label"
            style={{
              color: colorStyle,
            }}
          >
            {label}
          </span>
        </ValueChip>
      </>
    )
  },
)
