import styled from 'styled-components'

export const MeOrUserSwitchContainer = styled.div`
  display: flex;
  align-items: center;

  .me {
    height: 32px;
    gap: 4px;
    padding-right: 8px;
    border-radius: var(--border-radius) 0 0 var(--border-radius);

    background-color: var(--md-sys-color-surface-container-low);
    border: 1px solid var(--md-sys-color-outline-variant);

    &.selected {
      background-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    }
  }

  .dropdown {
    button {
      border-radius: 0 var(--border-radius) var(--border-radius) 0;
    }
    &.selected button {
      background-color: var(--md-sys-color-primary);
      & > div > span {
        color: var(--md-sys-color-on-primary);
      }
    }
  }
`
