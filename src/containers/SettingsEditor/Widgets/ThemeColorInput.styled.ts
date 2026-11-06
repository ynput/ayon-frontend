import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
`

// rendered inside a data-theme scope, so it shows the colour on that theme's surface
export const Sample = styled.span`
  padding: 2px 6px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container);
  font-weight: 600;
`

export const Fix = styled(Button)`
  &,
  .icon {
    color: var(--md-sys-color-warning);
  }
`

// the place of the warning button when there is no warning
export const Slot = styled.span`
  flex: 0 0 var(--base-input-size);
`
