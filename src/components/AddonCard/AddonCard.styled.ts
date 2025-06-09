import styled from 'styled-components'

export const AddonCard = styled.button`
  /* reset button */
  border: none;
  text-align: left;

  display: flex;
  padding: 8px;
  align-items: center;
  gap: var(--base-gap-large);
  align-self: stretch;
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;
  min-height: 40px;

  & > * {
    z-index: 1;
  }

  border-radius: 4px;
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-primary-container);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  span {
    word-break: break-all;
    line-height: 100%;
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);

      &:disabled {
        background-color: var(--md-sys-color-primary-container);
      }
    }
    .icon {
      /* fill icon */
      font-variation-settings: 'FILL' 1;
    }
  }

  &.error {
    background-color: var(--md-sys-color-error-container);
    &,
    .icon {
      color: var(--md-sys-color-on-error-container);
    }

    &:hover {
      background-color: var(--md-sys-color-error-container);
    }
  }

  .error {
    margin-left: auto;
    background-color: unset !important;
    color: var(--md-sys-color-on-error-container);
  }

  .endContent {
    margin-left: auto;

    /* for OS logos */
    svg {
      height: 20px;
      fill: var(--md-sys-color-on-surface);
    }
  }

  &:disabled {
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface);
    cursor: not-allowed;
    pointer-events: none;
  }
`
