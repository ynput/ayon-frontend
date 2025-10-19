import { forwardRef } from 'react'
import * as Styled from './TableGridSwitch.styled'

interface TableGridSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  showGrid: boolean
  onChange: (showGrid: boolean) => void
}

export const TableGridSwitch = forwardRef<HTMLDivElement, TableGridSwitchProps>(
  ({ showGrid, onChange, ...props }, ref) => {
    return (
      <Styled.ButtonsContainer {...props} ref={ref}>
        <Styled.InnerButton
          icon="table_rows"
          selected={!showGrid}
          onClick={() => onChange(false)}
          variant="text"
          data-tooltip="Table"
        />
        <Styled.InnerButton
          icon="grid_view"
          selected={showGrid}
          onClick={() => onChange(true)}
          variant="text"
          data-tooltip="Cards"
        />
      </Styled.ButtonsContainer>
    )
  },
)
