import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

// a pinned tab with changes not saved into its view
export const EditedDot = styled.span`
  width: 6px;
  height: 6px;
  margin-left: 2px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: var(--md-sys-color-primary);
`

// it sits in the tab's line: the negative margins keep the tab as tall as the others
export const TabMenuIcon = styled(Icon)`
  margin: -2px -8px -2px -2px;
  padding: 2px;
  border-radius: var(--border-radius-m);
  font-size: 18px;

  &:hover {
    background-color: var(--color-nav-hover);
  }
`
