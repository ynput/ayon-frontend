import { Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const DialogWrapper = styled(Dialog)`
  background-color: unset;
  overflow: hidden;
  border-radius: 0;

  width: 0;
  min-width: fit-content;

  .cancelButton {
    top: 1px;
    right: 1px;
    background-color: var(--md-sys-color-surface-container-highest);
  }

  /* Backdrop property affects inactive area around modal */
  &::backdrop {
    background-color: rgba(0, 0, 0, 0.7);
  }

  .header {
    display: none;
  }

  .body {
    padding: 0;
    align-items: center;
    user-select: none;
    overflow: hidden;
  }

  footer {
    display: none;
  }
`

export const Image = styled.img`
  height: 100%;
  width: 100%;

  width: max-content;
  height: max-content;
  max-height: 80vh;
  max-width: 90vw;
  background-color: var(--md-sys-color-surface-container-lowest);
`
