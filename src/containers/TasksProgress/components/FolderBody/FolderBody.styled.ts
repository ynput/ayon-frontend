import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: flex-start;
  height: 100%;

  & > * {
    height: 34px;
  }

  .title {
    display: flex;
    align-items: center;
  }
`

export const ExpandButton = styled(Button)`
  width: 34px;
  height: 34px;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &:active {
    background-color: var(--md-sys-color-surface-container-high-active);
  }
`
