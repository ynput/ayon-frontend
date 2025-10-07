import { Button, theme } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'
import { categoryColorCss, CommentProps } from '../CommentInput/CommentInput.styled'

export const CommentWrapper = styled.div`
  border-radius: var(--border-radius-m);
`

export const Comment = styled.li<CommentProps>`
  /* VARS */
  --background-color: var(--md-sys-color-surface-container);
  --button-color-secondary: var(--md-sys-color-surface-container-high);
  --border-color: transparent;
  /* CATEGORY */
  ${({ $categoryPrimary, $categorySecondary, $categoryTertiary }) =>
    categoryColorCss($categoryPrimary, $categorySecondary, $categoryTertiary)}

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

    .tools {
      opacity: 0;
    }

    .isEditing {
      z-index: 1000;
    }

    :not(.isEditing) {
      /* on hover show menu and hide date */
      &:hover {
        .tools {
          opacity: 1;
        }
      }
    }
  }

  &.isHighlighted {
    background-color: var(--md-sys-color-secondary-container);
  }
`

export const Body = styled.div`
  background-color: var(--background-color);
  border-radius: var(--border-radius-m);
  padding: var(--padding-m);
  padding: 12px 10px;
  position: relative;

  /* remove first and last margins */
  /* + * because tools is actual first */
  & > *:nth-child(2) + * {
    margin-top: 8px;
  }

  & > *:not(.tools):not(h1) {
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

  h1 {
    ${theme.titleLarge}
    font-size: 24px;
  }

  h2 {
    ${theme.titleMedium}
    font-size: 20px;
  }

  h3 {
    ${theme.titleSmall}
    font-size: 16px;
  }

  h1,
  h2,
  h3 {
    margin-top: 16px;
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
    margin: 16px 0;

    li {
      align-items: center;
    }

    & > * {
      padding-left: 1.5rem;
    }

    p {
      margin: 0;

      .reference {
        top: 0px;
        margin-left: 4px;
      }
    }
  }

  blockquote {
    margin: 0;
    padding-left: 16px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: var(--md-sys-color-outline-variant);
      border-radius: 2px;
    }
  }

  /* Inline code elements (not in pre blocks) */
  code:not(pre code) {
    font-family: monospace;
    background-color: var(--md-sys-color-surface-container-lowest);
    padding: 2px 4px;
    border-radius: 2px;
  }

  &.isEditing {
    padding: 0;
    border-radius: var(--border-radius-l);
  }
`

export const QuoteLine = styled.p`
  margin: 0;

  &:first-child {
    margin-top: 14px;
  }

  &:last-child {
    margin-bottom: 14px;
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
  font-family: monospace;
  font-size: var(--md-sys-typescale-body-small-font-size);

  line-break: anywhere;
  word-break: break-word;
  overflow: hidden;

  /* Ensure all child elements use monospace font */
  * {
    font-family: monospace !important;
  }
`

export const Tools = styled.div`
  display: flex;
  position: absolute;
  right: 4px;
  top: 4px;
  background-color: var(--button-color-secondary);
  border-radius: var(--border-radius-m);
  z-index: 50;
  padding: 2px;
  gap: var(--base-gap-small);
`

export const ToolButton = styled(Button)`
  &.hasIcon {
    padding: 4px;
  }

  &:hover {
    background-color: var(--button-color-secondary);
    filter: brightness(1.2);
  }

  [icon='edit_square'] {
    position: relative;
    top: -1px;
  }
`

export const Tip = styled.span`
  background-color: var(--md-sys-color-secondary-container);
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-m);
  padding: var(--padding-m);
  margin: 16px 0 !important;

  &,
  .icon {
    color: var(--md-sys-color-on-secondary-container);
  }

  p {
    margin: 0;
  }

  .icon {
    font-size: 24px;
  }
`
