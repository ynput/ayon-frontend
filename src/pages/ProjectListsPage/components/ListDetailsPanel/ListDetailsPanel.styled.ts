import styled from 'styled-components'
import { Panel as ARCPanel, Button, theme } from '@ynput/ayon-react-components'

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
  &:has(> *) {
    padding: var(--padding-m);
    padding-bottom: 0;

    &.border {
      border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }
  }
`

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--padding-m);
  margin-bottom: var(--padding-s);
  gap: var(--base-gap-large);

  border-bottom: 1px solid var(--md-sys-color-outline-variant);
`

export const Titles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: var(--padding-m);

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

export const CloseButton = styled(Button)`
  position: absolute;
  top: var(--padding-m);
  right: 2px;
`
