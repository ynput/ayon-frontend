import styled, { css } from 'styled-components'

export const Reference = styled.span<{
  $variant: 'surface' | 'filled' | 'text'
  $categoryPrimary?: string
  $categorySecondary?: string
}>`
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
    color: ${({ $categoryPrimary }) => $categoryPrimary || 'var(--md-sys-color-primary)'};
  }

  .icon {
    font-size: 20px;
  }

  background-color: ${({ $categorySecondary }) =>
    $categorySecondary || 'var(--md-sys-color-surface-container-high)'};

  &:hover {
    background-color: ${({ $categorySecondary }) =>
      $categorySecondary
        ? `color-mix(in srgb, ${$categorySecondary} 85%, white)`
        : 'var(--md-sys-color-surface-container-high-hover)'};
  }
  &:active {
    background-color: ${({ $categorySecondary }) =>
      $categorySecondary
        ? `color-mix(in srgb, ${$categorySecondary} 70%, white)`
        : 'var(--md-sys-color-surface-container-high-active)'};
  }

  ${({ $variant }) =>
    $variant === 'text' &&
    css`
      background-color: unset;
    `}

  ${({ $variant, $categoryPrimary }) =>
    $variant === 'filled' &&
    css`
      background-color: ${$categoryPrimary || 'var(--md-sys-color-primary)'};

      &,
      .icon {
        color: ${$categoryPrimary ? 'white' : 'var(--md-sys-color-on-primary)'};
      }

      &:hover {
        background-color: ${$categoryPrimary
          ? `color-mix(in srgb, ${$categoryPrimary} 85%, white)`
          : 'var(--md-sys-color-primary-hover)'};
      }

      &:active {
        background-color: ${$categoryPrimary
          ? `color-mix(in srgb, ${$categoryPrimary} 70%, white)`
          : 'var(--md-sys-color-primary-active)'};
      }
    `}

    /* remove background colour and hover on disabled */
    &.disabled {
    background-color: unset;
  }
`
