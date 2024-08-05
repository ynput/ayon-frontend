import { Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const DialogWrapper = styled(Dialog)`
  min-height: 90vh;
  max-height: 90vh;
  max-width: 1000px;

  .body {
    flex-direction: row;
    justify-content: center;
    padding-top: 0;
  }
  .navIcon {
    align-content: center;
    font-size: 48px;
    &:hover {
      cursor: pointer;
      color: var(--md-sys-color-primary);
    }
    &.disabled {
      color: var(--md-sys-color-outline-variant);
      &:hover {
        cursor: not-allowed;
      }
    }
  }

  /* custom image styles */
  &.isImage {
    /* remove min/max height */
    min-height: unset;
    max-height: unset;

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
      align-items: stretch;
      user-select: none;
      overflow: hidden;
    }

    footer {
      display: none;
    }

    /* remove focus outline */
    &:focus {
      outline: none;
    }
  }
  /* remove focus outline */
  &:focus-visible {
    outline: none;
  }
`

export const Image = styled.img`
  height: 100%;
  width: 100%;

  width: max-content;
  height: max-content;
  max-height: 80vh;
  max-width: 90vw;
  min-width: 300px;
  background-color: var(--md-sys-color-surface-container-lowest);
`
