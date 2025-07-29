import { theme } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ViewsMenu = styled.ul`
  /* reset defaults */
  margin: 0;
  padding: 0;
  list-style: none;

  display: flex;
  flex-direction: column;
`

// 1px line divider
export const ViewsMenuDivider = styled.li`
  height: 1px;
  background-color: var(--md-sys-color-outline);
  margin: 4px 0;
`

export const ViewsMenuTitle = styled.li`
  ${theme.labelSmall}
`
