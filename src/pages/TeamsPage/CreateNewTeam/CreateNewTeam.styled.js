import { Dialog, Section } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
`

export const StyledDialog = styled(Dialog)`
  .body {
    padding: 1px 16px;
    /* outline cut off hack */
    margin: -1px 0;
  }
  max-width: 1000px;
`

export const Container = styled(Section)`
  /* use display grid so that widths stay consistent */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
`
