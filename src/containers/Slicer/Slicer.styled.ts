import { Dropdown } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  flex: 1;

  display: flex;
  flex-direction: column;
`

export const Header = styled.div`
  padding: 2px;
  width: 100%;
  justify-content: space-between;
  position: relative;

  display: flex;
  gap: var(--base-gap-small);

  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`
export const SlicerDropdown = styled(Dropdown)`
  height: 28px;

  .template-value {
    border: 0;

    .icon:not(.control) {
      display: none;
    }
  }

  &.single-option {
    .control {
      display: none;
    }

    .button {
      .template-value {
        cursor: default;
      }
      &:hover {
        background-color: unset;
      }
    }
  }
`
