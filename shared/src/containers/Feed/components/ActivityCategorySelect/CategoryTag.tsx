import { theme } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { getTextColor } from '@shared/util'

const NO_CATEGORY_LABEL = 'Category'

const StyledTag = styled.div`
  display: flex;
  padding: 2px 4px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container);
  transition: background-color 0.2s;
  width: fit-content;
  user-select: none;
  position: relative;

  /* if there's a category the colour gets overridden */
  border: 1px solid var(--md-sys-color-outline-variant);

  &.none {
    &:not(:hover) {
      color: var(--md-sys-color-on-surface-variant);
    }
    &:hover {
      background-color: var(--md-sys-color-surface-container-high);
    }
  }

  &.compact {
    padding: 1px 2px;
    ${theme.labelMedium}
  }

  &.editing {
    &:hover:not(.none) {
      filter: brightness(1.2);
    }
  }

  &.disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  &.power {
    pointer-events: all;
    cursor: pointer;

    &:hover {
      border-color: var(--md-sys-color-tertiary);
      color: var(--md-sys-color-tertiary);
    }
  }
`

interface CategoryTagProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string | null
  color?: string
  isCompact?: boolean
  isEditing?: boolean
  isPower?: boolean
  isDisabled?: boolean
}

export const CategoryTag = forwardRef<HTMLDivElement, CategoryTagProps>(
  (
    { value, color, isCompact, isEditing, isPower, isDisabled, style, className, ...props },
    ref,
  ) => {
    return (
      <StyledTag
        {...props}
        ref={ref}
        className={clsx(className, {
          none: !value,
          compact: isCompact,
          editing: isEditing,
          power: isPower,
          disabled: isDisabled,
        })}
        style={{ ...style, backgroundColor: color, borderColor: color, color: getTextColor(color|| "#2E3133") }}
      >
        {value || NO_CATEGORY_LABEL}
      </StyledTag>
    )
  },
)
