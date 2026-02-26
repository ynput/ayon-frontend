import styled from 'styled-components'
import { InputText } from '@ynput/ayon-react-components'

export const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

export const FooterLabel = styled.label`
margin: 2px 0 14px 0;`

export const FooterActions = styled.div`
  display: flex;
  padding-top: 14px;
  gap: 8px;
  justify-content: flex-end;
`

export const ConfirmInput = styled(InputText)`
  width: 100%;
  margin-bottom: 16px;
`
