import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ButtonsContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  background-color: var(--md-sys-color-surface-container-high);
  padding: 2px;
  border-radius: var(--border-radius-m);
`

export const InnerButton = styled(Button)`
  &.hasIcon {
    padding: 4px;
    &:hover:not(.selected) {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }
`
