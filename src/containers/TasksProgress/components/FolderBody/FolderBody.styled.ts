import { Thumbnail } from '@shared/components/Thumbnail'
import { Button, StatusField } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Body = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0 !important;
  max-width: 500px;
  height: 100%;
  height: 34px;
  overflow: hidden;
  padding-left: var(--padding-s);

  & > * {
    height: 34px;
    display: flex;
    align-items: center;
  }

  .small-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: width 0.15s, opacity 0.15s;
  }

  .entity-card-wrapper {
    height: 0;
    opacity: 0;
    transition: height 0.15s, opacity 0.15s;
  }

  transition: height 0.15s;
  &.expanded {
    gap: var(--base-gap-small) !important;
    .small-title {
      width: 0;
      opacity: 0;
    }
    height: 110px;

    .entity-card-wrapper {
      height: 100%;
      opacity: 1;
    }
  }

  .entity-card {
    min-height: unset !important;
    height: 100%;
    aspect-ratio: 16 / 9;
    width: auto;
  }
`

export const ContentContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

export const ContentWrapper = styled.div`
  position: absolute;
  inset: 0;

  pointer-events: none;
  &.expanded {
    pointer-events: all;
  }
`

export const Path = styled.span`
  overflow: hidden;
  display: flex;
  gap: var(--base-gap-small);
  width: min-content;
  padding: var(--padding-s);
  border-radius: var(--border-radius-m);
  border: 1px solid transparent;
  flex: 1;

  /* first child ellipses */
  & > :first-child {
    white-space: nowrap;
    overflow: hidden;
  }

  cursor: pointer;
  &:hover {
    color: var(--md-sys-color-primary);
  }

  &.selected {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);

    &:hover {
      background-color: var(--md-sys-color-primary-hover);
    }
  }

  &.expanded {
    opacity: 0;
    width: 0;
    padding: 0;
  }
`

export const ExpandButton = styled(Button)`
  color: var(--md-sys-color-outline);

  &:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &:active {
    background-color: var(--md-sys-color-surface-container-high-active);
  }

  width: 0;
  height: 0;
  opacity: 0;
  padding: 0 !important;

  &:not(.expanded) {
    transition: width 0.15s, height 0.15s, opacity 0.15s;
  }

  &.expanded {
    width: 32px;
    height: 32px;
    opacity: 1;
    padding: 6px !important;
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

  transition: width 0.15s, height 0.15s, opacity 0.15s;

  height: 100%;
  max-height: unset;

  &.expanded {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .thumbnail {
    background-color: var(--md-sys-color-surface-container);
  }
`

export const Status = styled(StatusField)`
  width: 32px;
  padding: 0;
  justify-content: center;

  .status-text {
    display: none;
  }

  cursor: default;

  &.expanded {
    opacity: 0;
    width: 0;
    height: 0;
  }
`

export const FolderThumbnail = styled(Thumbnail)`
  width: 100%;
  height: 100%;
  width: auto;
  min-width: max-content;
  aspect-ratio: 16 / 9;

  cursor: pointer;

  /* &:hover {
    background-color: var(--md-sys-color-surface-container-hover);
    img {
      opacity: 0.7 !important;
    }
  } */

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
