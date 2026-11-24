import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'
import { Header } from '@shared/containers/SimpleTable'

// The table in a picker dialog. Rows that can't be picked are muted, not struck through, and their
// reason gets the space it needs (the name truncates first) so it never paints over other text
// (&& outranks SimpleTable's disabled rule).
export const PickerTableContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;

  && .disabled {
    .value {
      text-decoration: none;
    }
    .text {
      min-width: 0;
    }
    .badges {
      flex-shrink: 0;
    }
    .badges span {
      white-space: nowrap;
    }
  }
`

// The lists table header: title and buttons on top, the search (and filters) below
export const ListsHeader = styled(Header)`
  flex-direction: column;
  /* rows bring their own padding, the flex gap would double it */
  gap: 0;
`

export const ListsHeaderTop = styled(Header)`
  padding: 0;
  border: none;
`

export const ListsHeaderTitle = styled.span`
  display: flex;
  align-items: center;
  ${theme.labelLarge}
  height: 32px;
  padding-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
`

export const ListsHeaderButtons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`
