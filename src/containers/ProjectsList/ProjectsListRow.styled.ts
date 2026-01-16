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

  /* by default code is shown */
  .project-code {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--md-sys-color-outline);
  }

  /* when smaller than 85px: show code instead of name, hide action buttons */
  container-type: inline-size;
  @container (max-width: 85px) {
    /* hide project name, keep project code visible */
    .value {
      display: none;
    }
    .project-code {
      display: inline-block !important;
    }
    .settings-icon {
      display: none !important;
    }
    .pin {
      display: none !important;
    }
  }
  
  &.pinned {
    @container (max-width: 85px) {
      .pin {
        display: flex !important;
        position: absolute;
        top: -4px;
        right: -4px;
        padding: 1px;
        font-size: 14px;
      }
    }
  }

  .loading {
    pointer-events: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover);

    /* on hover - show icons, hide code */
    .settings-icon,
    .pin {
      display: flex;
    }
    .project-code {
      display: none;
    }
  }

  /* when pinned - always show pin icon, hide code */
  &.pinned {
    .pin {
      display: flex;
    }
    .project-code {
      display: none;
    }
  }

  /* when hidePinned - hide pin by default, show project code */
  &.hidePinned&.pinned {
    .pin {
      display: none;
    }
    .project-code {
      display: inline-block;
    }
    &.pinned:hover {
      .pin {
        display: flex;
        opacity: 0.7;
        font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
      }
      .project-code {
        display: none;
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
    /* update button styles on hover */
    .settings-icon,
    .pin {
      &:hover {
        background-color: var(--md-sys-color-on-primary);
        color: var(--md-sys-color-primary);
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
export const SettingsIcon = styled(Icon)`
  border-radius: var(--border-radius-m);
  padding: var(--padding-s);
  display: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`
export const Code = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const PinnedDivider = styled.hr`
  margin: 0;
  width: 100%;
  border-style: solid;
  border-width: 1px 0 0 0;
  border-color: var(--md-sys-color-outline-variant);
`
