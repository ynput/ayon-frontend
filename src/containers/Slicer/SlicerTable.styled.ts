import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const TableContainer = styled.div`
  display: flex;

  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 4px;
  padding-top: 8px;

  &.isLoading {
    overflow: hidden;
  }

  table {
    height: fit-content;
    width: 100%;
    display: grid;
  }

  thead {
    display: none;
  }

  tbody {
    position: relative;
    display: grid;
  }

  tr {
    position: absolute;
    display: flex;
    width: 100%;
    /* transform: set on dynamically */
  }

  td {
    height: 34px;
    padding: 1px 0px;
    width: 100%;
  }
`

export const Cell = styled.div`
  width: 100%;
  height: 100%;
  user-select: none;
  padding: 0px 4px;

  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  cursor: pointer;

  border-radius: var(--border-radius-m);

  .title {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .loading {
    pointer-events: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);

    &,
    .icon {
      color: var(--md-sys-color-on-primary-container);
    }
  }
`

export const Expander = styled(Button)`
  background-color: unset !important;
  padding: 2px !important;
`
