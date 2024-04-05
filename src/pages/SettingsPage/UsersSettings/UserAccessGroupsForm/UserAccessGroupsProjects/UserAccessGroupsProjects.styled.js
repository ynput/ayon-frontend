import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Header = styled.header`
  display: flex;
  gap: 4px;
  padding: 4px 0px 4px 8px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  position: relative;

  input {
    margin-left: -8px;
    width: calc(100% + 8px);
    position: relative;
    margin-right: -4px;
  }

  &:not(.searchOpen) {
    cursor: pointer;
  }

  &.disabled {
    pointer-events: none;
  }

  /* attribute icon='search' */
  .icon[icon='search'] {
    color: var(--md-sys-color-outline);
  }

  &:hover {
    .icon[icon='search'] {
      color: var(--md-sys-color-on-surface);
    }
  }
`

export const CloseIcon = styled(Icon)`
  cursor: pointer;

  position: absolute;
  right: 6px;

  color: var(--md-sys-color-outline);

  &:hover {
    color: var(--md-sys-color-on-surface);
  }
`

export const Buttons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  padding: 1px;
  margin: -1px;

  button {
    flex: 1;
    padding: 4px;
  }
`

export const ProjectItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: var(--border-radius-m);
  cursor: pointer;
  min-height: 28px;
  overflow: hidden;
  user-select: none;

  /* text overflow */
  .name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

  /* default styles (inactive) */
  color: var(--md-sys-color-outline);

  /* hide icon until hover or active */
  .icon {
    opacity: 0;
    user-select: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);

    .icon {
      opacity: 1;
    }
  }

  &.dragging {
    .icon {
      opacity: 0;
    }
  }

  &.active {
    color: var(--md-sys-color-on-surface);

    .icon {
      opacity: 1;
    }

    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }
  }

  &.disabled {
    opacity: 0.5;
    user-select: none;
    pointer-events: none;
    overflow: hidden;

    .icon {
      opacity: 0;
    }

    &:hover {
      background-color: transparent;
    }
  }
`

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  overflow: auto;
`
