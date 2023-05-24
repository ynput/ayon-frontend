import styled from 'styled-components'
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

  & > span {
    font-size: 26px !important;
  }
`

export default HeaderButton
