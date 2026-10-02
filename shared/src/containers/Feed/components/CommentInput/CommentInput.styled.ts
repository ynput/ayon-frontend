import styled, { css } from 'styled-components'
import { Button, getTextColor, InputText } from '@ynput/ayon-react-components'

export const AutoHeight = styled.div`
  /* use grid tick for auto height transition */
  display: grid;
  height: 100%;
  /* transition: translate 0.1s, margin-top 0.1s; */
  position: relative;

  /* when closed default */
  translate: 0 50px;
  margin-top: -50px;

  /* when open */
  &.isOpen {
    translate: 0 0;
    margin-top: 0;
  }

  padding: 0 4px 4px 4px;
  /* when editing */
  &.isEditing {
    padding: 0;
  }
`

export type CommentProps = {
  $categoryPrimary?: string
  $categorySecondary?: string
  $categoryTertiary?: string
}

// Reusable function for category color CSS
export const categoryColorCss = (
  $categoryPrimary?: string,
  $categorySecondary?: string,
  $categoryTertiary?: string,
) =>
  $categoryPrimary &&
  css`
    --background-color: ${$categoryTertiary};
    --button-color: ${$categoryPrimary};
    --button-color-secondary: ${$categorySecondary};
    --button-text-color: ${getTextColor($categoryPrimary)};
    --border-color: ${$categoryPrimary};
  `

export const Comment = styled.div<CommentProps>`
  /* VARS */
  --background-color: var(--md-sys-color-surface-container);
  --button-color: var(--md-sys-color-primary);
  --button-color-secondary: var(--md-sys-color-surface-container-highest);
  --button-text-color: var(--md-sys-color-on-primary);
  --border-color: var(--md-sys-color-outline-variant);

  &.category {
    /* CATEGORY */
    ${({ $categoryPrimary, $categorySecondary, $categoryTertiary }) =>
      categoryColorCss($categoryPrimary, $categorySecondary, $categoryTertiary)}
    button.comment {
      &:hover {
        background-color: var(--button-color);
        filter: brightness(1.2);
      }
    }
  }

  display: flex;
  flex-direction: column;
  position: relative;

  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  &.isDropping.isOpen {
    border-color: var(--md-sys-color-primary);
  }

  border-radius: var(--border-radius-l);
  overflow: hidden;
  transition: opacity 250ms 250ms, background-color 250ms, border-color 250ms;

  &.isOpen {
    /* box shadow */
    box-shadow: 0 -3px 10px 0 rgba(0, 0, 0, 0.2);
  }

  /* the markdown editor inherits the comment (and category) colours */
  .comment-editor {
    background-color: var(--background-color);
    border-radius: 0;

    .md-toolbar {
      border-bottom: 1px solid var(--md-sys-color-surface-container-hover);
      background-color: var(--background-color);
    }

    .md-toolbar-button {
      &:hover {
        background-color: var(--button-color-secondary);
      }
      &.active {
        background-color: var(--button-color-secondary);
        color: var(--button-color);
      }
    }

    .mention {
      color: var(--button-color);
      background-color: var(--button-color-secondary);

      &:hover {
        background-color: color-mix(in srgb, var(--button-color-secondary) 85%, white);
      }
    }
  }

  /* CLOSED */
  &.isClosed {
    cursor: pointer;
    &:hover:not(.disabled) {
      background-color: var(--md-sys-color-surface-container-high);
    }
  }

  &.disabled {
    cursor: default;
    pointer-events: none;
    user-select: none;
    border-color: var(--md-sys-color-surface-container-lowest);
    background-color: var(--md-sys-color-surface-container-lowest);
  }

  &.isLoading,
  &.isSubmitting {
    cursor: default;
    pointer-events: none;
    user-select: none;
  }

  /* EDITING */
  &.isEditing {
    /* remove box shadow */
    box-shadow: none;
    /* remove outline */
    outline: none;
  }
`

export const EditingCategory = styled.div`
  padding: 4px 4px 0;
`

export const ToolbarDivider = styled.span`
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background-color: var(--md-sys-color-surface-container-hover);
`

export const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  padding: var(--padding-m);
  border-top: 1px solid var(--md-sys-color-surface-container-hover);
  background-color: var(--background-color);
  z-index: 100;
  gap: var(--base-gap-small);
  container-type: inline-size;
  container-name: comment-input-footer;

  /* the frame link button can make the buttons too wide for a narrow panel:
     move the submit buttons onto their own line instead of hiding them */
  &:has(.frame-link) {
    flex-wrap: wrap;
  }

  /* remove save button icon */
  .comment {
    min-width: 75px;
    .icon {
      display: none;
    }
    background-color: var(--button-color);
    color: var(--button-text-color);
  }
`

export const Buttons = styled.div`
  display: flex;
  gap: var(--base-gap-small);

  &:has(.frame-link) {
    flex-wrap: wrap;
  }

  button {
    &.text {
      &:hover {
        background-color: var(--button-color-secondary);
      }
    }
  }
`

// one pill: the icon (link / unlink) at the start, then the frame, which is clicked to edit it
export const FrameLinkControl = styled.div`
  display: inline-flex;
  align-items: center;
  height: 32px;
  border-radius: var(--border-radius-m);

  &.selected {
    color: var(--md-sys-color-on-primary-container);
    background-color: var(--md-sys-color-primary-container);
    padding-right: 4px;
  }
`

export const FrameLinkButton = styled(Button)`
  color: inherit;
  background: transparent;

  .selected > & {
    &:hover {
      background-color: var(--md-sys-color-primary-container-hover) !important;
    }
  }
`

// the frame reads as text in the pill and edits in place
export const FrameLabel = styled.button`
  height: 24px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--border-radius-m);
  background: transparent;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  cursor: text;

  &:hover,
  &:focus-visible {
    border-color: var(--md-sys-color-outline);
    outline: none;
  }
`

export const FrameInput = styled(InputText)`
  height: 24px;
  min-height: 24px;
  min-width: 0;
  padding: 0 6px;
  border: 1px solid var(--md-sys-color-primary);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  font: inherit;

  &:focus {
    outline: none;
  }
`

export const SubmitButtons = styled(Buttons)`
  margin-left: auto;
  flex-shrink: 1;
  overflow: hidden;
`

export const Dropzone = styled.div`
  position: absolute;
  inset: 0;
  user-select: none;
  pointer-events: none;

  display: flex;
  justify-content: center;
  align-items: center;

  opacity: 0;
  transition: opacity 0.2s;

  &.show {
    opacity: 1;
  }

  background-color: rgba(0, 0, 0, 0.5);

  z-index: 300;

  .icon {
    font-size: 40px;
  }
`

export const Placeholder = styled.span`
  padding: 12px 15px;
  /* italic */
  font-style: italic;
  opacity: 0.4;
`

export const VersionReviewButtons = styled.div`
  display: grid;
  gap: var(--base-gap-medium);
  grid-template-columns: 1fr 1fr;
`

export const VersionReviewButtonsSpacer = styled.div`
  margin-top: var(--padding-m);
`

export const VersionReviewButton = styled(Button)`
  background: transparent;
  border: solid 1px currentColor;
  flex-grow: 1;
  height: 32px;

  &.danger {
    color: var(--md-sys-color-error);
  }

  &.tertiary {
    color: var(--md-sys-color-tertiary);
  }

  &:hover {
    background: rgb(from currentColor r g b / 0.25);
  }

  @container comment-input-footer (max-width: 345px) {
    .version-review-buttons.guest & .label {
      position: absolute;
      opacity: 0;
      width: 0;
      pointer-events: none;
    }
  }

  @container comment-input-footer (max-width: 510px) {
    .version-review-buttons:not(.guest) & .label {
      position: absolute;
      opacity: 0;
      width: 0;
      pointer-events: none;
    }
  }
`

export const LastOwnVersionReview = styled.div`
  border-radius: var(--border-radius-l);
  margin-bottom: var(--padding-m);
  user-select: none;
  display: flex;
  gap: var(--base-gap-small);
  overflow: hidden;
  padding: var(--padding-m) var(--padding-s);
  align-items: center;
  line-height: 1;

  &.approve,
  &.approve .icon,
  &.approve .date {
    background-color: var(--md-sys-color-tertiary);
    color: var(--md-sys-color-on-tertiary);
  }

  &.request_changes,
  &.request_changes .icon,
  &.request_changes .date {
    background-color: var(--md-sys-color-error);
    color: var(--md-sys-color-on-error);
  }
`
