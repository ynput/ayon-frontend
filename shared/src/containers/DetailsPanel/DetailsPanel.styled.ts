import styled from 'styled-components'
import { Toolbar as ARCToolbar, Panel as ARCPanel } from '@ynput/ayon-react-components'

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

export const Panel = styled(ARCPanel)`
  gap: 0px;
  height: 100%;
  padding: 0px;
  box-shadow: -2px 0 6px #00000047;
  z-index: 300;
`
