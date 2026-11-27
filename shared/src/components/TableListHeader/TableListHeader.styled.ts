import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'
import { Header as TableHeader } from '@shared/containers/SimpleTable/SimpleTable.styled'

// title and buttons on top, the search (and filters) below
export const Header = styled(TableHeader)`
  flex-direction: column;
  /* rows bring their own padding, the flex gap would double it */
  gap: 0;
`

// A grid, not flex: the title gets its full width first and the buttons the rest, down to the
// "more" button. Only then does the title shrink (shared flex shrinking would cut it by a fraction
// of a pixel, enough for an ellipsis). The buttons' minimum is the "more" button (a 20px icon with
// 4px padding): min-content would also keep one pinned button.
export const Top = styled(TableHeader)`
  --more-button-width: 28px;
  display: grid;
  grid-template-columns: minmax(0, max-content) minmax(var(--more-button-width), 1fr);
  padding: 0;
  border: none;

  &.has-title-start {
    grid-template-columns: auto minmax(0, max-content) minmax(var(--more-button-width), 1fr);
  }
`

export const Title = styled.span`
  ${theme.labelLarge}
  min-width: 0;
  height: 32px;
  line-height: 32px;
  padding-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

// The whole column (its width is the room for the buttons), the buttons on its right
export const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--base-gap-small);
  min-width: 0;
`

// Right to left from the first pinned button. The header hides the ones that don't fit
// (`pin-hidden`): out of the row but still measured. `clip`, not `hidden`: when even one button
// doesn't fit, focusing it must not scroll the row.
export const Pinned = styled.div`
  position: relative;
  display: flex;
  flex-direction: row-reverse;
  gap: var(--base-gap-small);
  flex: 0 1 auto;
  min-width: 0;
  overflow: clip;

  & > .pin-hidden {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
  }

  /* an item that is on (a sort, a grouping, an open search) */
  & > .highlighted {
    background-color: var(--md-sys-color-primary) !important;
    color: var(--md-sys-color-on-primary);
    &:hover {
      background-color: var(--md-sys-color-primary-hover) !important;
    }
    .icon {
      color: inherit;
    }
  }
`
