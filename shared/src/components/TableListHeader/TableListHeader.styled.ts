import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'
import { Header as TableHeader } from '@shared/containers/SimpleTable/SimpleTable.styled'

// title and buttons on top, the search (and filters) below
export const Header = styled(TableHeader)`
  flex-direction: column;
  /* rows bring their own padding, the flex gap would double it */
  gap: 0;
`

export const Top = styled(TableHeader)`
  padding: 0;
  border: none;
`

export const Title = styled.span`
  ${theme.labelLarge}
  /* takes the free space, and gives it up only once the pinned buttons are all gone */
  flex: 1 1 auto;
  min-width: 0;
  height: 32px;
  line-height: 32px;
  padding-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const Buttons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  /* shrinks before the title does, down to the "more" button */
  flex: 0 1000 auto;
`

// Right to left from the first pinned button. A button that doesn't fit wraps onto a second row,
// which the fixed height hides: the last pinned goes first.
export const Pinned = styled.div`
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: wrap;
  gap: var(--base-gap-small);
  flex: 0 1 auto;
  min-width: 0;
  height: 32px;
  overflow: hidden;
`
