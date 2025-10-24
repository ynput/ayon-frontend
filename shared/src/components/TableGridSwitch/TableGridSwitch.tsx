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
        // check we are not in an input or textarea
        const target = event.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox' ||
          target.tagName === 'LI'
        ) {
          return
        }
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
