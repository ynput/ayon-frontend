import styled from 'styled-components'
import { Panel, Dialog } from '@ynput/ayon-react-components'

export const HeaderStyled = styled(Panel)`
  gap: var(--base-gap-large);
  align-items: center;
  flex-direction: row;
  justify-content: space-between;

  h2 {
    font-size: 1.1rem;
    margin: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  & > div {
    display: flex;
    gap: var(--base-gap-large);
    align-items: center;
    flex: 1;
    overflow-x: clip;
  }
`

export const DialogStyled = styled(Dialog)`
  pre {
    white-space: pre-wrap;
    max-width: 800px;
    word-break: break-all;
  }
`

export const SubHeader = styled.span`
  white-space: nowrap;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`
