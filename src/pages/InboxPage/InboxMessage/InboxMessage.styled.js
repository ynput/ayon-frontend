import styled from 'styled-components'

export const Message = styled.li`
  padding: 10px 12px;

  cursor: pointer;
  user-select: none;

  background-color: var(--md-sys-color-surface-container-low);

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  border: 1px solid transparent;
  border-top-color: var(--md-sys-color-outline-variant);

  &.isSelected {
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-primary-container);
    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
    &:active {
      background-color: var(--md-sys-color-primary-container-active);
    }

    /* remove focus visible border if selected */

    &:focus-visible {
      outline: none;
    }

    /* highlight borders */
    border-color: var(--md-sys-color-primary);

    /* bottom border is top of next sibling */
    & + * {
      border-top-color: transparent;
    }
  }
`
