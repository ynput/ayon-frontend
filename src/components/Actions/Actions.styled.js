import { Button, Dropdown } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Actions = styled.div`
  display: flex;
  gap: 4px;
  position: relative;

  &::after {
    content: 'Coming Soon';
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--border-radius);
    font-weight: bold;
    z-index: 100;
  }
`

export const PinnedAction = styled(Button)`
  padding: 6px;
  img {
    width: 24px;
    height: 24px;
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
        width: 24px;
        height: 24px;
      }
    }
  }
`
