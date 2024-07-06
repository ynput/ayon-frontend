import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Card = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;

  padding: var(--padding-s);
  border-radius: var(--border-radius-m);
  gap: var(--base-gap-large);

  cursor: pointer;

  background-color: var(--md-sys-color-surface-container);

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);

    .handle {
      opacity: 1;
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
`

export const Image = styled.img`
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
