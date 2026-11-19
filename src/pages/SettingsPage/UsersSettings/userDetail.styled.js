import styled from 'styled-components'
import { LockedInput, Panel } from '@ynput/ayon-react-components'

export const PanelButtonsStyled = styled(Panel)`
  flex-direction: row;

  & > * {
    flex: 1;
  }
`

// edited in a dialog, but on the same surface as the fields edited in place, so it doesn't look disabled
export const EditableLockedInput = styled(LockedInput)`
  input {
    background-color: var(--md-sys-color-surface-container-low);

    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
  }
`
