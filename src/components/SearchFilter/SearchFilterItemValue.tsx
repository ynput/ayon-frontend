import { forwardRef } from 'react'
import { FilterValue } from './types'
import styled from 'styled-components'
import { Icon, theme } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import checkColorBrightness from './checkColorBrightness'

const ValueChip = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-m);

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

  &.custom {
    padding: 0 2px;
    background-color: var(--md-sys-color-surface-container-high-hover);
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
}

export const SearchFilterItemValue = forwardRef<HTMLDivElement, SearchFilterItemValueProps>(
  ({ value, label, img, icon, color, showOperator, isCompact, isCustom, ...props }, ref) => {
    const colorStyle = color ? color : '#ffffff'
    const adjustedColor = checkColorBrightness(colorStyle, '#353B46')

    return (
      <>
        {showOperator && <Operator>or</Operator>}
        <ValueChip {...props} ref={ref} className={clsx({ compact: isCompact, custom: isCustom })}>
          {icon && (
            <Icon
              icon={icon}
              style={{
                color: adjustedColor,
              }}
            />
          )}
          {img && <img src={img} alt={label} />}
          <span
            className="label"
            style={{
              color: adjustedColor,
            }}
          >
            {label}
          </span>
        </ValueChip>
      </>
    )
  },
)
