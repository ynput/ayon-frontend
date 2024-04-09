import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

export const ButtonWrapper = styled(Button)`
  padding: 6px;

  &.selected {
    background-color: var(--md-sys-color-on-primary);
    color: var(--md-sys-color-primary);

    &:hover {
      background-color: var(--md-sys-color-on-primary-hover);
    }
  }

  input {
    pointer-events: none;
  }
`
