import styled from 'styled-components'

export const Divider = styled.li`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: var(--padding-m) var(--padding-s) var(--base-gap-small);

  color: var(--md-sys-color-outline);
  user-select: none;

  &::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
`
