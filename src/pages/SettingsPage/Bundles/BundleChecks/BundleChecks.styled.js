import styled, { keyframes } from 'styled-components'

// spin animation
const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`

export const Status = styled.div`
  /* defaults */
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border-radius: var(--border-radius-m);
  padding: var(--padding-l) var(--padding-m);
  border: 1px solid transparent;

  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  .icon {
    color: inherit;
  }

  &.isLoading {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);

    .icon {
      animation: ${spin} 1s linear infinite;
    }
  }

  &.isError {
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }

  &.isWarning {
    background-color: var(--md-sys-color-warning-container);
    color: var(--md-sys-color-on-warning-container);
  }

  &.isSuccess {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  &.isCheckError {
    border-color: var(--md-sys-color-error-container);
  }
`

export const Checks = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  margin-top: 20px;
  flex: 1;

  overflow: hidden;
`

export const ErrorsList = styled.ul`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  overflow: auto;
`

export const ErrorItem = styled.li`
  padding: var(--padding-m);
  border-radius: var(--border-radius-m);

  /* remove defaults */
  list-style-type: none;

  background-color: var(--md-sys-color-surface-container-high);
  display: flex;
  gap: var(--base-gap-large);
  align-items: center;

  cursor: pointer;

  .icon {
    color: inherit;
  }

  &.error {
    background-color: var(--md-sys-color-on-error-container);
    color: var(--md-sys-color-error-container);
  }

  &.warning {
    color: var(--md-sys-color-warning-container);
    background-color: var(--md-sys-color-on-warning-container);
  }

  &:hover {
    filter: brightness(1.05);
  }
`
