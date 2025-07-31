import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ViewItem = styled.li`
  position: relative;
  padding: 4px 6px 4px 12px;

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
    background-color: var(--md-sys-color-primary);
    &,
    .icon {
      color: var(--md-sys-color-on-primary);
    }

    .more {
      &:hover {
        background-color: var(--md-sys-color-primary-hover);
      }
    }

    /* personal view item uses secondary colors */
    &.personal {
      background-color: var(--md-sys-color-secondary-container);
      &,
      .icon {
        color: var(--md-sys-color-on-secondary-container);
      }
    }
  }
`

export const MoreButton = styled(Button)`
  &.hasIcon {
    padding: 2px;
  }
  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`
