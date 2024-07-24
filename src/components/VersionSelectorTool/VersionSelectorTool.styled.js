import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Tools = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1;

  gap: var(--base-gap-small);

  .shortcut {
    padding: 0px 4px;
  }

  @media (max-width: 1550px) {
    .hero {
      display: none;
    }
  }
  @media (max-width: 1460px) {
    .approved {
      display: none;
    }
  }
  @media (max-width: 1330px) {
    .latest {
      display: none;
    }
  }
`

export const NavButton = styled(Button)`
  &.previous {
    padding-left: 4px;
    width: 110px;
  }
  &.next {
    padding-right: 4px;
    width: 110px;
  }

  transition: background-color 0.1s;
  /* when triggered using the shortcut */
  &.highlight {
    background-color: var(--md-sys-color-secondary-container);
  }
`
