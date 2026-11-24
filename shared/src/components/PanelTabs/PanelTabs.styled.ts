import styled from 'styled-components'
import { Toolbar } from '@ynput/ayon-react-components'

export const TabsContainer = styled(Toolbar)`
  border-radius: 8px 8px 0 0;
  gap: var(--base-gap-small) !important;
  position: relative;
  z-index: 100;
`

// an addon's tab, below its header: it fills the rest of the panel and scrolls in it
export const AddonTabContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
`
