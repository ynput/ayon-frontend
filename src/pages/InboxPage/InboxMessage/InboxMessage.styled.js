import styled, { css } from 'styled-components'
import ThumbnailSimple from '@/containers/ThumbnailSimple'
import { Button, getShimmerStyles } from '@ynput/ayon-react-components'

const showClearButton = css`
  &.isClearable {
    .clear {
      display: flex;
    }
    .user-image,
    .date {
      display: none;
    }
  }
`

export const Message = styled.li`
  padding: 0 var(--padding-s);
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  overflow: hidden;

  cursor: pointer;
  user-select: none;

  background-color: var(--md-sys-color-surface-container-low);

  &:hover:not(.disableHover):not(.isPlaceholder) {
    background-color: var(--md-sys-color-surface-container-low-hover);

    ${showClearButton}
  }

  /* use border instead of outline for focus */
  &:focus-visible {
    outline: none;
  }

  border: 1px solid transparent;
  border-top-color: var(--md-sys-color-outline-variant);

  /* last child margin */
  &:last-child {
    margin-bottom: 32px;
  }

  &.isSelected:not(.isPlaceholder) {
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
    &:active {
      background-color: var(--md-sys-color-primary-container-active);
    }

    /* remove focus visible border if selected */

    &:focus-visible {
      outline: none;
    }

    /* highlight borders */
    border-color: var(--md-sys-color-primary);

    /* bottom border is top of next sibling */
    & + * {
      border-top-color: transparent;
    }

    ${showClearButton}
  }

  /* when hovering or selected reveal clear button and hide user-image and date */
  .clear {
    display: none;
  }

  /* make all text grey when read */
  &.isRead {
    span:not(.icon) {
      color: var(--md-sys-color-outline);
    }

    .icon.type {
      color: var(--md-sys-color-outline);
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }

    /* fade status icons */
    .icon.status {
      opacity: 0.6;
    }
  }

  /* loading placeholder shimmer state */
  &.isPlaceholder {
    cursor: default;
    .left,
    .middle,
    .right {
      position: relative;
      border-radius: var(--border-radius-m);
      overflow: hidden;
      min-height: 30px;

      ${getShimmerStyles()}

      &::after {
        border-radius: var(--border-radius-m);
      }

      /* hide all children */
      * {
        display: none;
      }
    }

    .left {
      &::after {
        max-width: 80%;
      }
    }
    .middle {
      &::after {
        max-width: 60%;
      }
    }
  }
`

export const Left = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-medium);
  min-width: clamp(350px, 30vw, 500px);
  max-width: clamp(350px, 30vw, 500px);

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const Thumbnail = styled(ThumbnailSimple)`
  width: 50px;
  min-width: 50px;
  height: 30px;
  margin: 0;
  border-radius: var(--border-radius-m);
  margin-right: 4px;

  .icon {
    font-size: 18px;
  }
`

export const Middle = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  overflow: hidden;
  flex-grow: 1;
  align-items: center;

  .icon.type {
    font-size: 18px;

    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
`

export const Body = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`

export const Right = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 200px;
  justify-content: flex-end;
`

export const Date = styled.span`
  min-width: 50px;
  max-width: 50px;
  white-space: nowrap;
  margin-right: var(--padding-m);
`

export const ClearButton = styled(Button)`
  height: 30px;

  .shortcut {
    background-color: var(--md-sys-color-primary-container);

    color: var(--md-sys-color-on-primary-container) !important;
  }
`

export const Unread = styled.span`
  min-width: 18px;
  max-width: 18px;
  &.hide {
    opacity: 0;
  }
`
