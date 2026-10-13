import styled from 'styled-components'
import { Panel } from '@ynput/ayon-react-components'

export const PanelButtonsStyled = styled(Panel)`
  flex-direction: row;

  & > * {
    flex: 1;
  }
`
export const AvatarName = styled.span`
  display: flex;
  align-content: center;
  justify-content: center;
  align-items: center;
  padding: 16px 16px 8px 16px;
`
