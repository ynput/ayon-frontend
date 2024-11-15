import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  background-color: var(--md-sys-color-surface-container-low);

  height: 100%;
  min-width: 300px;
  overflow: auto;

  table {
    height: fit-content;
  }

  td {
    height: 40px;
  }
  thead {
    background-color: var(--md-sys-color-surface-container-low);
  }
`

export const TR = styled.tr`
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
  }
`
