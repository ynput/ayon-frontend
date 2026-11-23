// A panel tab's plain text search, for its header's search slot (PanelTabHeader `search`). It looks
// like the compact search and filter bar (SearchFilter `compact`) the other tabs put there: same
// height, border and search icon at the start, but text only, applied as it is typed. Escape or the
// clear button empties it.
import { Button, Icon } from '@ynput/ayon-react-components'
import * as Styled from './PanelTabSearch.styled'

export interface PanelTabSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export const PanelTabSearch = ({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: PanelTabSearchProps) => (
  <Styled.Wrapper className={className}>
    {/* a label: a click anywhere on the bar focuses the input */}
    <Styled.Bar className="search-bar">
      <Icon icon="search" className="search" />
      <Styled.Input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.stopPropagation()
            onChange('')
          }
        }}
      />
      {value && (
        <Button
          className="clear"
          icon="close"
          variant="text"
          aria-label="Clear search"
          data-tooltip="Clear search"
          onClick={() => onChange('')}
        />
      )}
    </Styled.Bar>
  </Styled.Wrapper>
)
