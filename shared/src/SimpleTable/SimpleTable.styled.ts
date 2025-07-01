import { Button, theme } from '@ynput/ayon-react-components'
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

  /* make error icon smaller */
  .empty-placeholder {
    width: 100%;
    padding: 8px;
    max-width: 240px;
    .icon {
      font-size: 32px;
    }
    h3 {
      ${theme.titleMedium}
    }
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
    padding: 1px 0px;
    width: 100%;
  }
`

export const Cell = styled.div`
  width: 100%;
  height: 32px;
  user-select: none;
  padding: 0px 4px;

  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  cursor: pointer;

  border-radius: var(--border-radius-m);

  .value {
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
  &.expander {
    background-color: unset;
    padding: 2px;
    cursor: pointer;
    &:hover {
      background-color: var(--md-sys-color-surface-container-high-hover);
    }
  }
`

// utility styles for wrapping the table
export const Container = styled.div`
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  flex: 1;

  display: flex;
  flex-direction: column;
`

export const Header = styled.div`
  padding: 2px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  position: relative;

  display: flex;
  gap: var(--base-gap-small);

  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

export const HeaderButton = styled(Button)`
  background-color: unset !important;
  z-index: 110;
  position: relative;

  &.hasIcon {
    padding: 4px;
  }

  &.open {
    background-color: unset !important;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }

  &.active {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }
`
