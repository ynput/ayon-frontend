import Thumbnail from '@components/Thumbnail'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: flex-start;
  max-width: 500px;
  height: 100%;
  min-height: 32px;
  overflow: hidden;

  & > * {
    height: 34px;
    display: flex;
    align-items: center;
  }
`

export const Path = styled.span`
  overflow: hidden;
  display: flex;
  gap: var(--base-gap-small);
  width: min-content;

  /* first child ellipses */
  & > :first-child {
    white-space: nowrap;
    overflow: hidden;

    display: flex;
    justify-content: flex-end;
  }
`

export const ExpandButton = styled(Button)`
  width: 34px;
  height: 34px;

  color: var(--md-sys-color-outline);

  &:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &:active {
    background-color: var(--md-sys-color-surface-container-high-active);
  }
`

export const FolderThumbnail = styled(Thumbnail)`
  width: auto;
  min-width: max-content;
  aspect-ratio: 16 / 9;
  height: 32px;
  max-height: 32px;
  margin: 0;
  border-radius: var(--border-radius-m);
  margin-right: 4px;

  .icon {
    font-size: 18px;
    display: flex !important;
  }
`
