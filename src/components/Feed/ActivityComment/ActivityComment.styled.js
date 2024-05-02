import styled, { css } from 'styled-components'

export const CommentWrapper = styled.div`
  border-radius: var(--border-radius-m);
`

export const Comment = styled.li`
  /* reset default */
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: column;
  gap: 4px;

  width: 100%;
  padding: 8px;
  border-radius: var(--border-radius-m);

  /* hide date and show tools */
  &.isOwner {
    /* by default hide menu */
    &:not(.isMenuOpen) {
      .tools {
        opacity: 0;
      }
    }

    .isEditing {
      z-index: 1000;
    }

    :not(.isEditing) {
      /* on hover show menu and hide date */
      &:hover,
      &.isMenuOpen {
        .tools {
          opacity: 1;
        }

        .date {
          opacity: 0;
          visibility: hidden;
        }
      }
    }

    /* when project menu open set button background */
    &.isMenuOpen .more {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }
`

export const Body = styled.div`
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--border-radius-m);
  padding: 8px;
  position: relative;

  /* remove first and last margins */
  & > *:first-child {
    margin-top: 0;
  }

  & > *:last-child {
    margin-bottom: 0;
  }

  a {
    color: var(--md-sys-color-primary);
  }

  img {
    width: 100%;
  }

  p {
    word-break: break-all;
    .reference {
      top: 5px;
    }
  }

  .contains-task-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 8px;
    margin: 8px 0;

    li {
      display: flex;
      align-items: center;
    }

    p {
      margin: 0;
      display: flex;
      align-items: flex-start;
    }

    .reference {
      top: 0;
      margin-left: 4px;
    }
  }

  &.isEditing {
    padding: 0;
    border-radius: var(--border-radius-l);
  }
`

export const Attachments = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

const attachmentBase = css`
  height: 100px;
  width: 100px;
  object-fit: contain;
  padding: 4px;
  cursor: pointer;
  position: relative;

  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);

  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
  }

  &:active {
    background-color: var(--md-sys-color-surface-container-high-active);
  }
`

export const AttachmentImg = styled.img`
  ${attachmentBase}
`

export const AttachmentFile = styled.a`
  ${attachmentBase}

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .icon {
    margin-bottom: 20px;
    font-size: 32px;
    color: var(--md-sys-color-outline);
  }
`

export const Name = styled.span`
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  text-align: center;
  /* break text */
  overflow-wrap: break-word;
  color: var(--md-sys-color-outline);
`

export const InlineCode = styled.code`
  padding: 0 var(--padding-s);
  border-radius: var(--padding-s);
  background-color: var(--md-sys-color-surface-container-lowest);

  text-wrap: pretty;
  line-break: anywhere;
  word-break: break-all;
`

export const BlockCode = styled.pre`
  padding: var(--padding-m);
  border-radius: var(--padding-s);
  background-color: var(--md-sys-color-surface-container-lowest);

  text-wrap: pretty;
  line-break: anywhere;
  word-break: break-all;
`
