import { forwardRef, useEffect } from 'react'
import * as Styled from './TableGridSwitch.styled'

interface TableGridSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  showGrid: boolean
  onChange: (showGrid: boolean) => void
}

export const TableGridSwitch = forwardRef<HTMLDivElement, TableGridSwitchProps>(
  ({ showGrid, onChange, ...props }, ref) => {
    useEffect(() => {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (event.key.toLowerCase() === 't') {
          onChange(false)
        } else if (event.key.toLowerCase() === 'g') {
          onChange(true)
        }
      }

      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }, [onChange])

    return (
      <Styled.ButtonsContainer {...props} ref={ref}>
        <Styled.InnerButton
          icon="table_rows"
          selected={!showGrid}
          onClick={() => onChange(false)}
          variant="text"
          data-tooltip="Table"
          data-shortcut="T"
        />
        <Styled.InnerButton
          icon="grid_view"
          selected={showGrid}
          onClick={() => onChange(true)}
          variant="text"
          data-tooltip="Cards"
          data-shortcut="G"
        />
      </Styled.ButtonsContainer>
    )
  },
)
