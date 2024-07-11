import styled, { keyframes } from 'styled-components'

// spin animation
const spinAnimation = keyframes`
  from {
    transform: rotate(360deg);
  }

  to {
    transform: rotate(0deg);
  }

`

export const UploadCard = styled.div`
  position: relative;
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  user-select: none;
  overflow: hidden;

  gap: var(--base-gap-large);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container);
  padding: 0 var(--padding-s);
  border: 1px solid var(--md-sys-color-surface-container);

  .content {
    flex: 1;
  }

  .name {
    display: block;
  }

  .message {
    color: var(--md-sys-color-outline);
  }

  .size {
    color: var(--md-sys-color-outline);
  }

  &.finished {
    .icon {
      /* remove animation */
      animation: none;
      /* full */
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
  }

  &.error {
    background-color: var(--md-sys-color-error-container);
    .progress {
      display: none;
    }
    & > *,
    .message {
      color: var(--md-sys-color-on-error-container);
    }
  }

  & > * {
    z-index: 10;
  }
`

export const ProgressBar = styled.div`
  position: absolute;
  inset: 0;
  background-color: var(--md-sys-color-primary-container);
  z-index: 0;
  transition: right 0.2s;
`

export const Type = styled.div`
  width: 71px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: var(--md-sys-color-surface-container-low);
  border-radius: var(--border-radius-m);

  .icon {
    font-size: 24px;

    &.spinning {
      /* spin animation */
      animation: ${spinAnimation} 1s infinite linear;
    }
  }
`
