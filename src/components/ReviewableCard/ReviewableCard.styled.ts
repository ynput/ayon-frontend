import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import FileThumbnail from '../FileThumbnail'

export const Card = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;

  padding: var(--padding-s);
  border-radius: var(--border-radius-m);
  gap: var(--base-gap-large);
  user-select: none;

  cursor: pointer;

  background-color: var(--md-sys-color-surface-container);

  border: 1px solid var(--md-sys-color-surface-container);

  &:not(.dragging):hover {
    background-color: var(--md-sys-color-surface-container-hover);

    .handle {
      opacity: 1;
    }

    &.draggable {
      .uploaded {
        display: none;
      }
    }
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    border-color: var(--md-sys-color-primary);

    &:hover {
      background-color: var(--md-sys-color-primary-container);
    }
  }

  &.drop-placeholder {
    opacity: 0;
  }

  &.drag-overlay {
    .handle {
      cursor: grabbing;
      /* override the default hidden until hover */
      opacity: 1;
    }
    background-color: var(--md-sys-color-surface-container-hover);
    &.selected {
      background-color: var(--md-sys-color-primary-container);
    }
  }

  /* uploaded icon */
  .uploaded {
    display: flex;
    gap: var(--base-gap-small);
    align-items: center;
    .icon {
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
  }
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  h4 {
    padding: 0;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .name {
    color: var(--md-sys-color-outline);
  }
`

export const StyledFileThumbnail = styled(FileThumbnail)`
  width: 71px;
  height: 40px;

  border-radius: var(--border-radius-m);

  object-fit: cover;
`

export const DragHandle = styled(Icon)`
  height: 100%;
  font-size: 25px;

  cursor: grab;

  /* default hidden */
  opacity: 0;
`
