import { forwardRef, useEffect } from 'react'
import * as Styled from './TableGridPlaylistSwitch.styled'
import { ReviewsSettings } from '@shared/api'

interface TableGridPlaylistSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: ReviewsSettings['displayStyle']
  onChange: (view: ReviewsSettings['displayStyle']) => void
}

export const TableGridPlaylistSwitch = forwardRef<HTMLDivElement, TableGridPlaylistSwitchProps>(
  ({ value, onChange, ...props }, ref) => {
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
          onChange("table")
        } else if (event.key.toLowerCase() === 'g') {
          onChange("cards")
        } else if (event.key.toLowerCase() === 'p') {
          onChange("playlist")
        }
      }

      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }, [onChange])

    return (
      <Styled.ButtonsContainer {...props} ref={ref}>
        <Styled.InnerButton
          icon="table_rows"
          selected={value === "table"}
          onClick={() => onChange("table")}
          variant="text"
          data-tooltip="Table"
          data-shortcut="T"
        />
        <Styled.InnerButton
          icon="grid_view"
          selected={value === "cards"}
          onClick={() => onChange("cards")}
          variant="text"
          data-tooltip="Cards"
          data-shortcut="G"
        />
        <Styled.InnerButton
          icon="format_list_bulleted"
          selected={value === "playlist"}
          onClick={() => onChange("playlist")}
          variant="text"
          data-tooltip="Playlist"
          data-shortcut="P"
        />
      </Styled.ButtonsContainer>
    )
  },
)
