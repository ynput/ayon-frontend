import { SortingDropdown } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  padding: var(--padding-m);
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  width: 100%;
`

export const Label = styled.label`
  white-space: nowrap;
  flex: 1;
`

export const Dropdown = styled(SortingDropdown)`
  .template-value {
    border: none;
  }

  .template-value {
    & > :nth-child(1) {
      display: none;
    }
    & > :nth-child(2) {
      color: var(--md-sys-color-outline);
    }
  }

  .template-value {
    &:has(.sort-chip) {
      /* hide first two children */

      & > :nth-child(2) {
        display: none;
      }
    }
  }

  .control {
    margin-left: auto;
  }
  button:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }
`
