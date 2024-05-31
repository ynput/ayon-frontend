import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Tools = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1;

  gap: var(--base-gap-small);
`

export const NavButton = styled(Button)`
  &.previous {
    padding-left: 4px;
  }
  &.next {
    padding-right: 4px;
  }

  transition: background-color 0.1s;
  /* when triggered using the shortcut */
  &.highlight {
    background-color: var(--md-sys-color-secondary-container);
  }

  .shortcut {
    padding: 0px 4px;
  }
`
