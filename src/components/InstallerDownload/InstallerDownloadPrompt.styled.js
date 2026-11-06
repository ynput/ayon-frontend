import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  z-index: 50;
`

// a quiet surface button on every page: the primary icon keeps it findable without outshining the page
export const DownloadButton = styled(Button)`
  border-radius: 4px 0 0 4px;
  flex: 1;
  max-height: unset;

  .icon {
    color: var(--md-sys-color-primary);
  }
`

export const CloseButton = styled(Button)`
  border-radius: 0 4px 4px 0;
  left: -4px;
  position: relative;

  .icon {
    color: var(--md-sys-color-on-surface-variant);
  }
`
