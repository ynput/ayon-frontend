import styled, { css } from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import { Thumbnail } from '@shared/components'

const showClearButton = css`
  &.clearable {
    .clear {
      display: flex;
    }
    .date {
      display: none;
    }
    &.multiSelected {
      .user-image {
        display: none;
      }
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

  /* messages are rows on the content surface, like table rows, in a list on a panel */
  --inbox-row-bg: var(--color-table-row);
  background-color: var(--inbox-row-bg);

  &:hover:not(.disableHover):not(.placeholder) {
    --inbox-row-bg: var(--color-table-row-hover);

    ${showClearButton}
  }

  /* use border instead of outline for focus */
  &:focus-visible {
    outline: none;
  }

  border: 1px solid transparent;

  &:not(:first-child) {
    border-top-color: var(--md-sys-color-outline-variant);
  }

  /* the day divider already draws its own line */
  .inbox-date-divider + & {
    border-top-color: transparent;
  }

  /* last child margin */
  &:last-child {
    margin-bottom: 32px;
    border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
  }

  &.isSelected:not(.placeholder) {
    border-radius: var(--border-radius-m);
    --inbox-row-bg: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    &:hover {
      --inbox-row-bg: var(--md-sys-color-primary-container-hover);
    }
    &:active {
      --inbox-row-bg: var(--md-sys-color-primary-container-active);
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
  }

  /* a multi-selection shows the button on hover only, one row keeps it pinned */
  &.isSelected:not(.placeholder):not(.multiSelected) {
    ${showClearButton}
  }

  /* when hovering or selected reveal clear button and hide user-image and date */
  .clear {
    display: none;
  }

  /* the subject of an unread message stands out, like in a mail inbox */
  &:not(.isRead) .title {
    font-weight: 600;
  }

  /* make all text grey when read */
  &.isRead {
    span:not(.icon):not(.shortcut) {
      color: var(--md-sys-color-outline);
    }

    .icon.type {
      color: var(--md-sys-color-outline);
      font-variation-settings: 'FILL' 0;
    }

    /* fade status icons */
    .icon.status {
      opacity: 0.6;
    }
  }

  /* loading placeholder shimmer state */
  &.placeholder {
    cursor: default;
    .left,
    .middle,
    .right,
    .title {
      min-height: 30px;
    }

    .title {
      min-width: 300px;
    }

    .right {
      min-width: unset;
      margin-left: 40px;
    }
  }
`

export const Left = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-medium);
  /* a fixed width, unless the row is too narrow for the status change and the date: then the title gives way */
  flex: 0 1 clamp(260px, 20vw, 380px);
  min-width: 200px;
  max-width: clamp(260px, 20vw, 380px);

  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

// rows have no thumbnails, only the entity type's icon, without the empty image box around it
export const MessageThumbnail = styled(Thumbnail)`
  width: 20px;
  min-width: 20px;
  max-width: 20px;
  height: 30px;
  max-height: 30px;
  margin: 0;
  border-radius: var(--border-radius-m);
  background-color: transparent;

  .icon {
    font-size: 18px;
  }
`

export const Middle = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  overflow: hidden;
  flex: 1 1 0;
  align-items: center;

  .icon.type {
    font-size: 18px;

    font-variation-settings: 'FILL' 1;
  }

  /* a status change keeps room for its icon-only form (two status squares and the arrow between them),
     after the unread count's place */
  &.status-change {
    min-width: calc(24px + var(--base-gap-large) + 2 * 20px + 18px + 2 * 4px);
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

export const DateContainer = styled.div`
  /* wide enough for a date and time ("22 Oct 2026, 22:43"), right aligned so rows line up */
  min-width: 140px;
  max-width: 140px;
  display: flex;
  justify-content: flex-end;
  margin-right: var(--padding-m);
`

export const Date = styled.span`
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

// a row action, not the page's main one: compact and quiet
export const ClearButton = styled(Button)`
  height: 24px;
  min-height: 24px;
  padding: 0 6px;
  gap: 4px;
`

/* number of unread messages in the thread, as a small badge */
export const Unread = styled.span`
  flex-shrink: 0;
  /* same width for one and two digits, so the icons after it line up */
  min-width: 24px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);

  &.hide {
    opacity: 0;
  }
`
