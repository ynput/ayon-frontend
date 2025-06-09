import styled, { css } from 'styled-components'

export const Reference = styled.span<{ $variant: 'surface' | 'filled' | 'text' }>`
  gap: 2px;
  display: inline-flex;
  border-radius: var(--border-radius-m);
  width: min-content;
  position: relative;
  user-select: none;
  padding: 0;
  padding-right: 4px;
  white-space: nowrap;
  cursor: pointer;

  align-items: center;

  &,
  .icon {
    color: var(--md-sys-color-primary);
  }

  .icon {
    font-size: 20px;
  }

  background-color: var(--md-sys-color-surface-container-high);

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }
  &:active {
    background-color: var(--md-sys-color-surface-container-high-active);
  }

  ${({ $variant }) =>
    $variant === 'text' &&
    css`
      background-color: unset !important;
    `}

  ${({ $variant }) =>
    $variant === 'filled' &&
    css`
      background-color: var(--md-sys-color-primary);

      &,
      .icon {
        color: var(--md-sys-color-on-primary);
      }

      &:hover {
        background-color: var(--md-sys-color-primary-hover);
      }

      &:active {
        background-color: var(--md-sys-color-primary-active);
      }
    `}

    /* remove background colour and hover on disabled */
    &.disabled {
    background-color: unset !important;
  }
`
