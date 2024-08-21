import Thumbnail from '@components/Thumbnail'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: flex-start;
  min-width: 200px;
  max-width: 500px;
  height: 100%;
  min-height: 32px;

  & > * {
    height: 34px;
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

export const FolderThumbnail = styled(Thumbnail)`
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  height: 30px;
  max-height: 30px;
  margin: 0;
  border-radius: var(--border-radius-m);
  margin-right: 4px;

  .icon {
    font-size: 18px;
    display: flex !important;
  }
`
