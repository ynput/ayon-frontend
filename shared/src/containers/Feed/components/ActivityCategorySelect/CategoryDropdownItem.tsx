import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef } from 'react'
import styled from 'styled-components'

const StyledItem = styled.span`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
  white-space: nowrap;

  [icon='crop_square'] {
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    font-size: 16px;
  }

  &.selected {
    [icon='crop_square'] {
      font-variation-settings: 'FILL' 0, 'wght' 200, 'GRAD' 200, 'opsz' 20;
      color: var(--md-sys-color-on-surface) !important;
    }
  }
`

export interface CategoryDropdownItemProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
  label: string
  color: string | null
  icon?: string // override icon if needed
  startContent?: React.ReactNode
  endContent?: React.ReactNode
  isClear?: boolean
  isSelected?: boolean
}

export const CategoryDropdownItem = forwardRef<HTMLSpanElement, CategoryDropdownItemProps>(
  (
    {
      label,
      color,
      icon,
      isSelected,
      startContent,
      endContent,
      isClear,
      style,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <StyledItem
        {...props}
        className={clsx(className, { selected: isSelected })}
        style={{ backgroundColor: isSelected && color ? color : '', ...style }}
        ref={ref}
      >
        {startContent}
        {
          <Icon
            icon={icon ? icon : isClear ? 'clear' : 'crop_square'}
            style={{ color: color || '' }}
          />
        }
        {label}
        {endContent}
      </StyledItem>
    )
  },
)
