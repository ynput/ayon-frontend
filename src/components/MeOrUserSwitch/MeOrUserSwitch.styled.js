import styled from 'styled-components'

export const MeOrUserSwitchContainer = styled.div`
  display: flex;
  align-items: center;

  .switch-button {
    height: 32px;
    gap: var(--base-gap-small);
    padding-right: 8px;
    border-radius: 0;

    background-color: var(--md-sys-color-surface-container-low);
    border: 1px solid var(--md-sys-color-outline-variant);

    &.selected {
      background-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }

    &:not(.selected):hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  }

  .all {
    border-right: none;
  }

  .me {
    border-radius: var(--border-radius) 0 0 var(--border-radius);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-right: none;
  }

  .dropdown {
    button {
      border: 1px solid var(--md-sys-color-outline-variant);
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
      outline: none !important;
      padding-left: var(--padding-s);
      white-space: nowrap;
    }
    &.selected button {
      background-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      & > div > span {
        color: var(--md-sys-color-on-primary);
      }
    }
  }
`
