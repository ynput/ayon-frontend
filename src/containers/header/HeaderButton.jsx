import styled, { css } from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

const HeaderButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  user-select: none;

  background-color: transparent;
  z-index: 20;

  & > span {
    font-size: 26px !important;
  }

  /* fix until new buttons come in */
  /* active */
  ${({ active }) =>
    active &&
    css`
      background-color: var(--md-sys-color-surface-container-highest);
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      outline: solid 1px var(--md-sys-color-outline-variant);
      background-color: var(--md-sys-color-background);
    `}
`

export default HeaderButton
