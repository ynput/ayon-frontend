import styled from 'styled-components'
import { InputText, Dialog } from '@ynput/ayon-react-components'

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

export const StyledDialog = styled(Dialog)`
  .body {
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
`

export const UserList = styled.div`
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 8px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
`
