import { Button, Dropdown, getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Actions = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  position: relative;
`

export const FeaturedAction = styled(Button)`
  padding: 6px;
  user-select: none;
  position: relative;
  img {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }

  &.isLoading {
    .icon,
    img {
      opacity: 0;
    }
    overflow: hidden;

    background-color: unset;

    ${getShimmerStyles()}
  }
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

  &.isLoading {
    button {
      position: relative;
      background-color: unset;
    }
    ${getShimmerStyles()}
    opacity: 0.5;
    overflow: hidden;
    border-radius: var(--border-radius-m);

    .icon {
      opacity: 0;
    }
  }
`
