import { Toolbar } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const TasksToolbar = styled(Toolbar)`
  z-index: 100;
  padding: 0 8px;
  height: 36px;
  z-index: 10;

  overflow: auto;

  & > * {
    height: 32px;
  }

  /* hide scrollbar */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    display: none;
  }

  z-index: 100;
`
