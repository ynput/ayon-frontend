import styled from 'styled-components'
import { Dialog } from '@ynput/ayon-react-components'

// ARC's Dialog always renders its header; `dialogHeader: false` hides it
export const AddonDialog = styled(Dialog)`
  .header.no-header {
    display: none;
  }
`
