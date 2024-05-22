import styled from 'styled-components'
import ThumbnailSimple from '/src/containers/ThumbnailSimple'

export const Message = styled.li`
  padding: 0 var(--padding-m);
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  overflow: hidden;

  cursor: pointer;
  user-select: none;

  background-color: var(--md-sys-color-surface-container-low);

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  border: 1px solid transparent;
  border-top-color: var(--md-sys-color-outline-variant);

  &.isSelected {
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
  }

  /* when hovering or selected reveal clear button and hide user-image and date */
  .clear {
    display: none;
  }
  &:hover,
  &.isSelected {
    .clear {
      display: flex;
    }
    .user-image,
    .date {
      display: none;
    }
  }

  /* make all text grey when read */
  /* but not when selected */
  &.isRead:not(.isSelected) {
    span:not(.icon) {
      color: var(--md-sys-color-outline);
    }

    .icon.type {
      color: var(--md-sys-color-outline);
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
  }
`

export const Left = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-medium);
  min-width: 350px;
  max-width: 350px;
`

export const Thumbnail = styled(ThumbnailSimple)`
  width: 39px;
  min-width: 39px;
  height: 22px;
  margin: 0;
  border-radius: var(--border-radius-m);

  .icon {
    font-size: 15px;
  }
  margin-right: var(--padding-);
`

export const Middle = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  overflow: hidden;
  flex-grow: 1;

  .icon {
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
  min-width: 150px;
  justify-content: flex-end;
`

export const Date = styled.span`
  min-width: 50px;
  max-width: 50px;
`
