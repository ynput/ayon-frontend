import { Toolbar as ARCToolbar } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Toolbar = styled(ARCToolbar)`
  display: flex;
  justify-content: space-between;
  padding: var(--padding-m);
  padding-bottom: 0;
`

export const Buttons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`
