import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

export const HiddenFileInput = styled.input`
  display: none;
`

export const SheetPicker = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--base-gap-large);

  & > * {
    flex-grow: 0;
  }
`

export const SheetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  margin: 0 auto;
  min-width: 300px;
  max-height: 50vh;
  overflow-y: auto;
`

export const SheetButton = styled(Button)`
  justify-content: flex-start;
`

export const ChangeSheetButton = styled(Button)`
  padding: 2px;
  min-height: unset;

  .icon {
    font-size: 18px;
  }
`
