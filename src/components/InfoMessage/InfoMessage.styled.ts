import styled from 'styled-components'

export const MessageCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: var(--padding-m) var(--padding-l);
  border-radius: var(--border-radius-m);
  font-weight: 600;

  .icon {
    font-size: 24px;
  }

  /* default background */
  &.info {
    --message-background-color: var(--md-sys-color-secondary-container);
    --message-color: var(--md-sys-color-on-secondary-container);
  }

  /* warning background */
  &.warning {
    --message-background-color: var(--md-sys-color-warning-container);
    --message-color: var(--md-sys-color-on-warning-container);
  }

  /* error background */
  &.error {
    --message-background-color: var(--md-sys-color-error-container);
    --message-color: var(--md-sys-color-on-error-container);
  }

  /* success background */
  &.success {
    --message-background-color: var(--md-sys-color-tertiary-container);
    --message-color: var(--md-sys-color-on-tertiary-container);
  }

  background-color: var(--message-background-color);
  &,
  .icon {
    color: var(--message-color);
  }
`
