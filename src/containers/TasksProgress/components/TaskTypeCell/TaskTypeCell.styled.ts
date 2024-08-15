import styled from 'styled-components'

export const Cell = styled.div`
  padding: 4px;
  flex: 1;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-secondary-container);
    box-shadow: inset 0px 0px 0px 2px var(--md-sys-color-outline);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    box-shadow: inset 0px 0px 0px 2px var(--md-sys-color-primary);
  }
`
