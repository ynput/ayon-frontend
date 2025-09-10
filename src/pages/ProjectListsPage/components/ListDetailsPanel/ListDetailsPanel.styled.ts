import styled from 'styled-components'
import { Panel as ARCPanel, theme } from '@ynput/ayon-react-components'

export const Panel = styled(ARCPanel)`
  gap: 0px;
  height: 100%;
  padding: 0px;
  box-shadow: -2px 0 6px #00000047;
  z-index: 300;
  overflow: scroll;
`

export const Scrollable = styled.div`
  overflow: auto;
  flex: 1;
`

export const Section = styled.div`
  padding: var(--padding-m);

  &.border {
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
`

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--padding-m) var(--padding-l);
  margin-bottom: var(--padding-s);
  gap: var(--base-gap-small);

  border-bottom: 1px solid var(--md-sys-color-outline-variant);

  .title {
    ${theme.titleMedium}
    margin: 0;
    width: 100%;
  }
  .type {
    display: flex;
    gap: 4px;
    width: 100%;
  }
`
