import clsx from 'clsx'
import { forwardRef } from 'react'
import styled from 'styled-components'

const NO_CATEGORY_LABEL = 'Category'

const StyledTag = styled.div`
  display: flex;
  padding: 2px 4px;
  justify-content: center;
  align-items: center;
  gap: 2px;
  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container);
  transition: background-color 0.2s;

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
`

interface CategoryTagProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string | null
  color?: string
}

export const CategoryTag = forwardRef<HTMLDivElement, CategoryTagProps>(
  ({ value, color, style, className, ...props }, ref) => {
    return (
      <StyledTag
        {...props}
        ref={ref}
        className={clsx(className, { none: !value })}
        style={{ ...style, backgroundColor: color, borderColor: color }}
      >
        {value || NO_CATEGORY_LABEL}
      </StyledTag>
    )
  },
)
