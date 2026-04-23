import { forwardRef, useEffect } from 'react'
import * as Styled from './TableGridPlaylistSwitch.styled'

export enum TableGridPlaylistView {
  TABLE = "table",
  GRID = "cards",
  PLAYLIST = "playlist",
}

interface TableGridPlaylistSwitchProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value: TableGridPlaylistView
  onChange: (view: TableGridPlaylistView) => void
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
          onChange(TableGridPlaylistView.TABLE)
        } else if (event.key.toLowerCase() === 'g') {
          onChange(TableGridPlaylistView.GRID)
        } else if (event.key.toLowerCase() === 'p') {
          onChange(TableGridPlaylistView.PLAYLIST)
        }
      }

      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }, [onChange])

    return (
      <Styled.ButtonsContainer {...props} ref={ref}>
        <Styled.InnerButton
          icon="table_rows"
          selected={value === TableGridPlaylistView.TABLE}
          onClick={() => onChange(TableGridPlaylistView.TABLE)}
          variant="text"
          data-tooltip="Table"
          data-shortcut="T"
        />
        <Styled.InnerButton
          icon="grid_view"
          selected={value === TableGridPlaylistView.GRID}
          onClick={() => onChange(TableGridPlaylistView.GRID)}
          variant="text"
          data-tooltip="Cards"
          data-shortcut="G"
        />
        <Styled.InnerButton
          icon="format_list_bulleted"
          selected={value === TableGridPlaylistView.PLAYLIST}
          onClick={() => onChange(TableGridPlaylistView.PLAYLIST)}
          variant="text"
          data-tooltip="Playlist"
          data-shortcut="P"
        />
      </Styled.ButtonsContainer>
    )
  },
)
