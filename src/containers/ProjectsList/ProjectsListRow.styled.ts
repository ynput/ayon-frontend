import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* by default code is hidden */
  .project-code {
    display: none;
    width: 100%;
    overflow: hidden;
  }

  /* reveal code and hide label when smaller than 96px */
  /* pin also becomes smaller */
  container-type: inline-size;
  @container (max-width: 85px) {
    .project-code {
      display: inline-block;
    }
    .value {
      display: none;
    }
    .pin {
      position: absolute;
      top: -4px;
      right: -4px;
      padding: 1px;
      font-size: 14px;
    }
  }

  .loading {
    pointer-events: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);

    /* on hover - show pin */
    &.selected {
      .pin {
        display: flex;
      }
    }
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
    pointer-events: none;
    user-select: none;
  }

  /* filled icon */
  .icon.filled {
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }
`

export const Pin = styled.span`
  border-radius: var(--border-radius-m);
  padding: var(--padding-s);
  display: none;

  /* when active, always show and fill */
  &.active {
    display: flex;
    opacity: 0.7;
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`

export const PinIcon = styled(Icon)`
  border-radius: var(--border-radius-m);
  padding: var(--padding-s);
  display: none;

  /* when active, always show and fill */
  &.active {
    display: flex;
    opacity: 0.7;
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`

export const ProjectCount = styled.span`
  color: var(--md-sys-color-outline);
  padding-right: 4px;
`