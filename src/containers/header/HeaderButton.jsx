import styled, { css } from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

const HeaderButton = styled(Button)`
  max-height: unset;
  min-height: unset;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;

  background-color: transparent;
  padding: 4px;
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
`

export default HeaderButton
