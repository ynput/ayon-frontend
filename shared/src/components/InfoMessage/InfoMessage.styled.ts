import styled from 'styled-components'

export const MessageCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: var(--padding-m) var(--padding-l);
  border-radius: var(--border-radius-m);
  font-weight: 600;

  .content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icon {
    font-size: 24px;
  }

  /* default background */
  &.info {
    --message-background-color: var(--md-sys-color-secondary-container);
    --message-color: var(--md-sys-color-on-secondary-container);
    --button-background-color: var(--md-sys-color-secondary);
    --button-background-color-hover: var(--md-sys-color-secondary-hover);
    --button-color: var(--md-sys-color-on-secondary);
  }

  /* warning background */
  &.warning {
    --message-background-color: var(--md-sys-color-warning-container);
    --message-color: var(--md-sys-color-on-warning-container);
    --button-background-color: var(--md-sys-color-warning);
    --button-background-color-hover: hsl(25, 100%, 80%);
    --button-color: var(--md-sys-color-on-warning);
  }

  /* error background */
  &.error {
    --message-background-color: var(--md-sys-color-error-container);
    --message-color: var(--md-sys-color-on-error-container);
    --button-background-color: var(--md-sys-color-error);
    --button-background-color-hover: var(--md-sys-color-error-hover);
    --button-color: var(--md-sys-color-on-error);
  }

  /* success background */
  &.success {
    --message-background-color: var(--md-sys-color-tertiary-container);
    --message-color: var(--md-sys-color-on-tertiary-container);
    --button-background-color: var(--md-sys-color-tertiary);
    --button-background-color-hover: var(--md-sys-color-tertiary-hover);
    --button-color: var(--md-sys-color-on-tertiary);
  }

  background-color: var(--message-background-color);
  &,
  .icon {
    color: var(--message-color);
  }

  button {
    &,
    &.hasIcon {
      padding: 4px;
    }
    background-color: var(--button-background-color);
    &,
    .icon {
      color: var(--button-color);
    }
    &:hover {
      background-color: var(--button-background-color-hover);
    }
  }
`
