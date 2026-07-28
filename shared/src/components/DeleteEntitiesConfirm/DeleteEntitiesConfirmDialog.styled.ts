import styled from 'styled-components'
import { Dialog, InputText } from '@ynput/ayon-react-components'

export const StyledDialog = styled(Dialog)`
  max-height: min(600px, 90vh);
`

export const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`

export const FooterLabel = styled.label`
  margin: 2px 0 14px 0;
`

export const FooterActions = styled.div`
  display: flex;
  padding-top: 14px;
  gap: 8px;
  justify-content: flex-end;
`

export const CountRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 30vh;
  overflow-y: auto;
  /* scroll container clips the inputs' 2px focus outline — inset it, then pull back to keep alignment */
  padding: 4px;
  margin: -4px;
`

export const CountRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

export const CountInput = styled(InputText)`
  width: 120px;
`

export const ConfirmInput = styled(InputText)`
  width: 100%;
  /* room for the 2px focus outline */
  margin: 2px 0;
`
