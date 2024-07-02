import { Button } from '@ynput/ayon-react-components'
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
  gap: var(--base-gap-small);

  width: 100%;
  padding: var(--padding-m);
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
      }
    }

    /* when project menu open set button background */
    &.isMenuOpen .more {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
  }

  &.isHighlighted {
    background-color: var(--md-sys-color-secondary-container);
  }
`

export const Body = styled.div`
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--border-radius-m);
  padding: var(--padding-m);
  padding: 12px 10px;
  position: relative;

  /* remove first and last margins */
  /* + * because tools is actual first */
  & > *:first-child + * {
    margin-top: 0;
  }

  & > *:not(.tools) {
    margin-bottom: 0;
  }

  a {
    color: var(--md-sys-color-primary);
  }

  img {
    width: 100%;
  }

  p {
    word-break: break-word;
    .reference {
      top: 5px;
    }
  }

  ul,
  ol {
    .reference {
      top: 6px;
    }
  }

  .contains-task-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--base-gap-large);
    padding-left: 8px;
    margin: 8px 0;

    li {
      align-items: center;
    }

    p {
      margin: 0;
      padding-left: 1.5rem;

      .reference {
        top: 0px;
        margin-left: 4px;
      }
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
  gap: var(--base-gap-large);
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

export const BlockCode = styled.pre`
  padding: var(--padding-m);
  border-radius: var(--padding-s);
  background-color: var(--md-sys-color-surface-container-lowest);

  line-break: anywhere;
  word-break: break-word;
  overflow: hidden;
`

export const Tools = styled.div`
  display: flex;
  position: absolute;
  right: 4px;
  top: 4px;
  background-color: var(--md-sys-color-surface-container-highest);
  border-radius: var(--border-radius-m);
`

export const ToolButton = styled(Button)`
  padding: 4px;

  [icon='edit_square'] {
    position: relative;
    top: -1px;
  }
`
