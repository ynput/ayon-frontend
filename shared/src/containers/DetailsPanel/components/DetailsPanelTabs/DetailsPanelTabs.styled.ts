import styled from 'styled-components'
import { Toolbar } from '@ynput/ayon-react-components'

export const TabsContainer = styled(Toolbar)`
  border-radius: 8px 8px 0 0;
  gap: var(--base-gap-small) !important;
  position: relative;
  z-index: 100;
  grid-column: span 2;
`
