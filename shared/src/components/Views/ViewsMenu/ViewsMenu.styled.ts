import { theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Scrollable = styled.div`
  overflow: auto;
  max-height: 40vh;
`

export const ViewsMenu = styled.ul`
  /* reset defaults */
  margin: 0;
  padding: 0;
  list-style: none;

  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  margin-bottom: var(--padding-s);
`

// 1px line divider
export const ViewsMenuDivider = styled.li`
  height: 1px;
  background-color: var(--md-sys-color-outline-variant);
  margin: 4px 0;
`

export const ViewsMenuTitle = styled.li`
  ${theme.labelSmall}
  color: var(--md-sys-color-outline);
`
