import { Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const DialogWrapper = styled(Dialog)`
  min-height: 90vh;
  max-height: 90vh;
  min-width: min(90vw, 100%);
  max-width: 1000px;

  .body {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    padding-top: 0;
    overflow: hidden;
  }
  .navIcon {
    position: absolute;
    top: 50%;
    user-select: none;

    &.left {
      left: 0;
      translate: -100% -50%;
    }
    &.right {
      right: 0;
      translate: 100% -50%;
    }
    align-content: center;
    font-size: 60px;
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

    background-color: unset !important;
    border-radius: 0;

    width: 0;

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

export const ScrollableContent = styled.div`
  &.scrollable {
    position: absolute;
    inset: 56px;
    overflow: auto;
  }
`
