import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

const HeaderButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  user-select: none;
  position: relative;

  background-color: transparent;
  z-index: 20;

  & > span {
    font-size: 26px !important;
  }
  /* set home icon filled */
  &#home-button {
    .icon {
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
    padding-right: 12px;
  }

  /* fix until new buttons come in */
  /* active */

  &.active {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  &.selected {
    outline: solid 1px var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-background);
  }

  &::after {
    content: '';
    position: absolute;
    right: -2px;
    top: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--md-sys-color-error);
    user-select: none;
    pointer-events: none;

    /* closed */
    opacity: 0;
    scale: 0;

    transition: opacity 0.1s, scale 0.1s;
    transition-delay: 0.5s;
    transition-timing-function: cubic-bezier(0, 0.67, 0.48, 1.47);
  }

  /* open */
  &.notification::after {
    opacity: 1;
    scale: 1;
  }
`

export default HeaderButton
