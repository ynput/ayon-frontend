import { Button } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

export const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  z-index: 50;
`

export const ButtonColors = css`
  background-color: var(--md-sys-color-primary);

  &:hover {
    background-color: var(--md-sys-color-primary-hover, var(--md-sys-color-primary));
  }
  &,
  .icon {
    color: var(--md-sys-color-on-primary);
  }
`

export const DownloadButton = styled(Button)`
  border-radius: 4px 0 0 4px;
  flex: 1;
  max-height: unset;

  ${ButtonColors}
`

export const CloseButton = styled(Button)`
  border-radius: 0 4px 4px 0;
  left: -4px;
  position: relative;

  ${ButtonColors}
`
