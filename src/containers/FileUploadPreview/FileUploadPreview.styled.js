import { Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const DialogWrapper = styled(Dialog)`
  background-color: unset;
  width: unset;
  max-width: 90%;
  max-height: 90%;

  .cancelButton {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  .body {
    padding: 0;
  }

  footer {
    display: none;
  }
`

export const Image = styled.img`
  height: 100%;
  width: 100%;
`
