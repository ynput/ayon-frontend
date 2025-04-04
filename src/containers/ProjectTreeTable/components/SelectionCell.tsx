import { Icon } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'
import styled from 'styled-components'

const StyledSelectionCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  /* This is super important as it prevents onMouseOver incorrectly firing when Icon is added/removed */
  pointer-events: none;
  height: 100%;

  /* default hidden. Shown with styles in ProjectTreeTable.styled */
  [icon='check'] {
    display: none;
  }
`

interface SelectionCellProps extends React.HTMLAttributes<HTMLDivElement> {
  isSelected?: boolean
}

export const SelectionCell = forwardRef<HTMLDivElement, SelectionCellProps>(
  ({ isSelected, ...props }, ref) => {
    return (
      <StyledSelectionCell {...props} ref={ref}>
        <Icon icon="check" />
      </StyledSelectionCell>
    )
  },
)
