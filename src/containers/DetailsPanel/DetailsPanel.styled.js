import styled from 'styled-components'
import { Toolbar as ARCToolbar } from '@ynput/ayon-react-components'

export const Toolbar = styled(ARCToolbar)`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--padding-m);
  padding-bottom: 0;

  & > * {
    min-width: max-content;
  }
`

export const RightTools = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`
