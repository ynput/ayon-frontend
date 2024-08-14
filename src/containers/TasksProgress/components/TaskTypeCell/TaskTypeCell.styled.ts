import styled from 'styled-components'

export const Cell = styled.div`
  padding: 4px;
  flex: 1;
  border: 1px solid transparent;

  &:hover {
    background-color: var(--md-sys-color-secondary-container);
    border-color: var(--md-sys-color-outline);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    border-color: var(--md-sys-color-primary);
  }
`
