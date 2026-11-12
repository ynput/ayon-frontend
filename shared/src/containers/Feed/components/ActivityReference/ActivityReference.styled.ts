import styled, { css } from 'styled-components'
import { getTagColors, getTextColor } from '@ynput/ayon-react-components'

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

  /* in a comment with a category: tinted with its colour like a tag, never coloured text */
  ${({ $categoryPrimary }) => {
    if (!$categoryPrimary) return ''
    const colors = getTagColors($categoryPrimary)
    return css`
      &,
      .icon {
        color: ${colors.text};
      }
      background-color: ${colors.background};
      box-shadow: inset 0 0 0 1px ${colors.border};
      &:hover,
      &:active {
        background-color: ${colors.background};
        filter: brightness(0.97);
      }
    `
  }}

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
        color: ${$categoryPrimary
          ? getTextColor($categoryPrimary)
          : 'var(--md-sys-color-on-primary)'};
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
