import { Button, Icon, theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { FileThumbnail } from '@shared/components'

export const Card = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
  min-height: 50px;

  padding: var(--padding-s);
  border-radius: var(--border-radius-m);
  gap: var(--base-gap-large);
  user-select: none;

  cursor: pointer;

  background-color: var(--md-sys-color-surface-container);

  border: 1px solid var(--md-sys-color-surface-container);

  &:not(.dragging):hover {
    background-color: var(--md-sys-color-surface-container-hover);
    border: 1px solid var(--md-sys-color-surface-container-hover);
  }

  /* show edit controls */
  &:not(.dragging):hover,
  &.selected {
    .handle {
      opacity: 1;
    }

    &.draggable {
      .uploaded {
        display: none;
      }
    }

    /* show edit button */
    .edit {
      display: flex;
    }
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    border-color: var(--md-sys-color-primary);

    &:hover {
      background-color: var(--md-sys-color-primary-container);
      border-color: var(--md-sys-color-primary);
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
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;

  /* prevent edit button being cutoff */
  padding: 2px;
  margin: -2px;

  h4 {
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
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

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  h4 {
    ${theme.titleSmall}
  }
`

export const EditButton = styled(Button)`
  /* hidden by default and show on card hover */
  display: none;
  .icon {
    font-size: 18px;
  }

  &.hasIcon {
    padding: 3px;
  }

  margin: -2px;
`

export const StyledFileThumbnail = styled(FileThumbnail)`
  width: 71px;
  height: 40px;

  border-radius: var(--border-radius-m);

  object-fit: cover;
`

export const DragHandle = styled(Icon)`
  font-size: 25px;

  cursor: grab;

  /* default hidden */
  opacity: 0;
`
