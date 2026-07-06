import { Dropdown } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const StyledDropdown = styled(Dropdown)`
  --button-bg: unset;
  --button-bg-hover: var(--md-sys-color-surface-container-highest-hover);
  --icon-color: var(--md-sys-color-on-surface);

  &.developer {
    --button-bg: var(--color-hl-developer-container);
    --button-bg-hover: var(--color-hl-developer-container-hover);
    --icon-color: var(--color-hl-developer);
  }

  &.staging {
    --button-bg: var(--color-hl-staging-container);
    --button-bg-hover: var(--color-hl-staging-container-hover);
    --icon-color: var(--color-hl-staging);
  }

  height: unset;
  button {
    background-color: var(--button-bg);
    max-height: 28px;
    max-width: 28px;
    min-height: 28px;
    min-width: 28px;
    & > div {
      padding: 0;
      border: 0;
      padding: 0 4px;
      gap: 0;
    }
    * {
      opacity: 1 !important;
    }

    .icon {
      vertical-align: middle;
      color: var(--icon-color);
    }

    &:hover {
      background-color: var(--button-bg-hover);
    }
  }

  &.loading {
    border-radius: 4px;
  }
`

export const DropdownItem = styled.div`
  display: flex;
  gap: var(--base-gap-large);

  padding: 6px;
  padding-right: 12px;

  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
`

export const DropdownHeader = styled.div`
  color: var(--md-sys-color-outline);
  padding: 4px 6px;
`
