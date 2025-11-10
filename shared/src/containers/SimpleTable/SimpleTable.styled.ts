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
  min-height: 32px;
  user-select: none;
  padding: 0px 4px;

  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  cursor: pointer;

  border-radius: var(--border-radius-m);

  .text {
    width: 100%;
    overflow: hidden;
    display: flex;
  }

  .value {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .path {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: fit-content;
    margin-right: 4px;
    flex: 1; // path ellipsis first before value
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

    /* update expander styles */
    .expander {
      &:hover {
        background-color: var(--md-sys-color-on-primary);
      }
    }
  }

  &.inactive {
    .icon,
    .value {
      color: var(--md-sys-color-outline);
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed !important;

    &,
    .value,
    .icon {
      color: var(--md-sys-color-outline);
    }

    &:hover {
      background-color: transparent;
    }

    .value {
      text-decoration: line-through;
    }
  }

  /* filled icon */
  .icon.filled {
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }

  .image {
    width: auto;
    height: 24px;
    max-height: 24px;
    object-fit: cover;
    aspect-ratio: 1;
    background-color: var(--md-sys-color-surface-container-lowest);
    margin-right: 4px;

    &.circle {
      border-radius: 50%;
    }

    &.square {
      border-radius: 4px;
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
  height: 100%;
  flex: 1;

  display: flex;
  flex-direction: column;
  position: relative;
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
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }

  &.active {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }
`
