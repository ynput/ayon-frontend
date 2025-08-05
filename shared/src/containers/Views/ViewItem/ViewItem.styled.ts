import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ViewItem = styled.li`
  position: relative;
  padding: 4px 6px 4px 12px;
  user-select: none;

  &:has(.start-icon) {
    padding-left: 8px;
  }

  height: 32px;
  border-radius: var(--border-radius-m);

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  cursor: pointer;

  .label {
    flex: 1;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    &,
    .icon {
      color: var(--md-sys-color-on-primary-container);
    }

    .more {
      &:hover {
        background-color: var(--md-sys-color-primary-container-hover);
      }
    }
  }

  /* hide save button by default */
  .save {
    display: none;
  }
  &:hover {
    .save {
      display: flex;
    }
  }
`

export const ActionButton = styled(Button)`
  &.hasIcon {
    padding: 2px;
  }
  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
  &.active {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);

    display: flex !important;

    &:hover {
      background-color: var(--md-sys-color-primary-hover);
    }
  }
`
