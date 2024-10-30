import Thumbnail from '@components/Thumbnail'
import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: flex-start;
  max-width: 500px;
  height: 100%;
  height: 32px;
  overflow: hidden;
  padding-left: var(--padding-s);

  & > * {
    height: 34px;
    display: flex;
    align-items: center;
  }

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: width 0.15s, opacity 0.15s;
  }

  transition: height 0.15s;
  &.expanded {
    .title {
      width: 0;
      opacity: 0;
    }
    height: 100px;
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

  cursor: pointer;
  &:hover {
    text-decoration: underline;
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

  .icon {
    transition: rotate 0.1s ease;
  }
  &.collapsed {
    .icon {
      rotate: -90deg;
    }
  }
`

export const ThumbnailCard = styled.div`
  position: relative;

  height: 32px;
  max-height: 32px;
  margin: 0;
  border-radius: var(--border-radius-m);
  margin-right: 4px;

  overflow: hidden;

  transition: padding-bottom 0.2s;

  height: 100%;
  max-height: unset;

  &.expanded {
    padding-bottom: 10px;
  }
`

export const FolderThumbnail = styled(Thumbnail)`
  width: 100%;
  height: 100%;
  width: auto;
  min-width: max-content;
  aspect-ratio: 16 / 9;

  border-radius: 0;
  img {
    border-radius: 0;
  }
  .icon {
    font-size: 18px;
    display: flex !important;
  }
`

export const ThumbnailShotName = styled.span`
  opacity: 0;

  transition: opacity 0.2s;
  &.expanded {
    opacity: 1;
  }

  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  padding: var(--padding-s) var(--padding-m);
  background-color: var(--md-sys-color-surface-container);
`
