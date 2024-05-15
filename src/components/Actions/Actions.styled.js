import { Button, Dropdown, getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Actions = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  position: relative;

  &.isLoading {
    .icon {
      opacity: 0;
    }

    button {
      background-color: unset;
    }
    border-radius: var(--border-radius-m);
    overflow: hidden;

    ${getShimmerStyles()}
  }
`

export const PinnedAction = styled(Button)`
  padding: 6px;
  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }

  opacity: 0.2;
`

export const More = styled(Dropdown)`
  height: unset;
  opacity: 0.2;
  button {
    background-color: var(--md-sys-color-surface-container-highest);
    div {
      padding: 0;
      border: 0;
      padding: 6px;

      & > div {
        display: none;
      }
      & > span {
        width: 20px;
        height: 20px;
      }
    }

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest);
    }
  }
`
