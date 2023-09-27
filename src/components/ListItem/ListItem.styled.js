import styled, { css } from 'styled-components'
import Thumbnail from '/src/containers/thumbnail'
import StatusSelect from '../status/statusSelect'
import { AssigneeSelect } from '@ynput/ayon-react-components'

export const Item = styled.li`
  /* reset defaults */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  padding: 8px 16px 8px 8px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  cursor: pointer;
  user-select: none;

  background-color: var(--md-sys-color-surface-container-lowest);
  border: 1px solid transparent;
  border-top-color: var(--md-sys-color-outline-variant);

  &:hover {
    background-color: var(--md-sys-color-surface-container-lowest-hover);
  }

  &:active {
    background-color: var(--md-sys-color-surface-container-lowest-active);
  }

  &.selected {
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-primary-container);
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
  }

  /* if $isFirst */
  ${({ $isFirst }) =>
    $isFirst &&
    css`
      border-top-color: var(--md-sys-color-surface-container-lowest);
    `}
  /* if $isLast */
  ${({ $isLast }) =>
    $isLast &&
    css`
      border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);

      &.selected {
        border-bottom-color: var(--md-sys-color-primary);
      }
    `}
`

export const ItemStatus = styled(StatusSelect)`
  height: 24px;
  width: 24px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }

    .icon {
      border-radius: var(--border-radius-l);
      font-size: 16px;
    }
    .status-field {
      width: 20px;
      height: 20px;
      padding: 0;
      min-height: unset;
      display: flex;
      align-items: center;
      justify-content: center;

      span:last-child {
        display: none;
      }
    }
    .icon {
      margin: 0;
      color: var(--md-sys-color-inverse-on-surface);
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
  }
  & > div {
    transform: translateX(-4px);
  }
`

export const ItemThumbnail = styled(Thumbnail)`
  width: 40px;
  height: 24px;
  margin: 0;

  .icon {
    font-size: 20px;
  }
`

export const Path = styled.div`
  display: flex;
  gap: var(--base-gap-medium);
`

export const PathItem = styled.span`
  color: var(--md-sys-color-outline);

  &.last {
    /* last path bold */

    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }

  &:not(:first-child) {
    &::after {
      content: '/';
      margin-left: var(--base-gap-medium);
      color: var(--md-sys-color-outline);
    }
  }
`

export const Name = styled.div`
  display: flex;
  &,
  .icon {
    color: var(--md-sys-color-outline);
  }
  gap: var(--base-gap-small);
`

export const ItemAssignees = styled(AssigneeSelect)`
  height: 24px;
  .button {
    & > div {
      padding: 2px;
      height: unset;
    }

    background-color: unset;
    &:hover {
      background-color: var(--md-sys-color-surface-container-hover);
    }

    span:not(.user-image) {
      /* remove name label */
      display: none;
    }

    .user-image {
      top: 0;
    }
  }
`
