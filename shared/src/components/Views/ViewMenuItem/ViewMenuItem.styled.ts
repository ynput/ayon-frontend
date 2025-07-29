import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ViewMenuItem = styled.li`
  position: relative;
  padding: 12px 6px 6px 6px;
  border-radius: var(--border-radius-m);

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  .label {
    flex: 1;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &.selected {
    background-color: var(--md-sys-color-primary);
    &,
    .icon {
      color: var(--md-sys-color-on-primary);
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
  padding: 2px;
`
