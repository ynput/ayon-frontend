import styled from 'styled-components'
import { InputText, Panel } from '@ynput/ayon-react-components'

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

// a value that can't be changed here: the text without an input box, like the details of a bundle
export const ReadOnlyInput = styled(InputText)`
  &,
  &:hover,
  &:focus {
    background-color: transparent;
    border-color: transparent;
    outline: none;
  }
  cursor: default;
`
