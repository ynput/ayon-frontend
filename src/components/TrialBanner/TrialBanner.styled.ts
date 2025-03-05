import { theme } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

// slide up animation
export const slideUp = keyframes`
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
`

export const TrialBanner = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 500;

  display: flex;
  justify-content: center;
  gap: var(--base-gap-small);

  background-color: var(--md-sys-color-tertiary);
  padding: var(--padding-m);
  box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.1);

  transform: translateY(100%);
  animation: ${slideUp} 1s ease 1s forwards;

  .icon {
    color: var(--md-sys-color-on-tertiary);
  }

  span:not(.icon),
  a {
    color: var(--md-sys-color-on-tertiary);
    ${theme.titleMedium}
  }

  button {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
  }

  &.urgent {
    background-color: var(--md-sys-color-warning-container);

    span,
    a {
      color: var(--md-sys-color-on-warning-container);
    }
  }

  &.critical {
    background-color: var(--md-sys-color-error-container);

    span,
    a {
      color: var(--md-sys-color-on-error-container);
    }
  }
`
export const TrialBubble = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  order: -1;

  gap: var(--base-gap-small);
  padding: var(--padding-s);
  padding-right: var(--padding-m);
  border-radius: var(--border-radius-m);
  user-select: none;
  cursor: pointer;

  background-color: var(--panel-background);

  ${theme.titleMedium}
  &,
  .icon {
    color: var(--md-sys-color-tertiary);
  }

  .icon {
    font-size: 24px;
  }

  &:hover {
    background-color: var(--md-sys-color-tertiary-hover);

    &,
    .icon {
      color: var(--md-sys-color-on-tertiary);
    }
  }
`
