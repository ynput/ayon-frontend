import styled from 'styled-components'
import { theme } from '@ynput/ayon-react-components'

export const Placeholder = styled.div`
  position: absolute;
  /* centred in the pane; left and right with an auto margin, so the message can use the pane's width */
  top: 50%;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: fit-content;
  max-width: calc(100% - 32px);
  transform: translateY(-50%);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  user-select: none;

  h3 {
    text-align: center;
    ${theme.titleLarge}
  }

  .placeholder-icon {
    font-size: 64px;
    padding: 8px;
    background-color: var(--md-sys-color-secondary-container);
    border-radius: 100%;
    color: var(--md-sys-color-on-secondary-container);
  }

  /* narrow columns and side panels */
  &.compact {
    gap: 12px;

    .placeholder-icon {
      font-size: 32px;
    }

    /* smaller, same weight as the full size */
    h3 {
      font-size: 16px;
      line-height: 24px;
    }
  }

  /* a prompt that can't be acted on yet: its prerequisite (e.g. a selection in the previous pane) is missing */
  &.muted {
    .placeholder-icon {
      background-color: transparent;
      color: var(--md-sys-color-outline);
    }

    h3 {
      color: var(--md-sys-color-outline);
    }
  }

  &.isError {
    .placeholder-icon {
      color: var(--md-sys-color-error-container);
      background-color: var(--md-sys-color-on-error-container);
    }

    .error-message {
      max-width: 700px;
      color: var(--md-sys-color-error-on-container);
      background-color: var(--md-sys-color-error-container);

      padding: var(--padding-m) var(--padding-m);
      border-radius: var(--border-radius-m);
      user-select: text;
      margin-top: -16px;
    }
  }
`
