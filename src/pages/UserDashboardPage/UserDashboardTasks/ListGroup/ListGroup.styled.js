import styled, { css } from 'styled-components'

export const Header = styled.header`
  display: flex;
  padding: 4px;
  align-items: center;
  position: relative;
  gap: var(--base-gap-large);
  align-self: stretch;
  width: 100%;
  z-index: 20;
  user-select: none;
  min-height: 40px;

  border-bottom: 1px solid var(--md-sys-color-surface-container-low);
  background-color: var(--md-sys-color-background);

  /* create gap between groups */
  &:not(:first-child) {
    margin-top: 8px;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: var(--border-radius-m) var(--border-radius-m) 0 0;
    background-color: var(--md-sys-color-surface-container-low);
  }

  & > * {
    z-index: 10;
  }

  position: sticky;
  top: 0;

  .icon {
    transition: rotate 0.1s;
  }

  ${({ $isCollapsed }) =>
    $isCollapsed &&
    css`
      /* radius all sides */
      border-radius: var(--border-radius-m);

      .icon {
        rotate: -90deg;
      }
    `}

  ${({ $isLoading }) =>
    $isLoading &&
    css`
      opacity: 0.5;
    `}
`
