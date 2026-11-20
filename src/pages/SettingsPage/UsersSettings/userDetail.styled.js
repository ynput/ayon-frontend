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

// The forms of the panel. With the flat settings layout (class flat-form, src/styles/flatForm.scss)
// they sit on a sheet of their own, like a flat settings page
export const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: var(--base-gap-small);
  display: flex;
  flex-direction: column;

  &.flat-form {
    gap: 20px;
    padding: 4px 16px 16px;
    border-radius: var(--border-radius-m);
    background-color: var(--panel-background);
  }
`
