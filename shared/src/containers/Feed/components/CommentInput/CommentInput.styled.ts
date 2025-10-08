import styled, { css } from 'styled-components'

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
    --border-color: ${$categoryPrimary};
  `

export const Comment = styled.div<CommentProps>`
  /* VARS */
  --background-color: var(--md-sys-color-surface-container);
  --button-color: var(--md-sys-color-primary);
  --button-color-secondary: var(--md-sys-color-surface-container-highest);
  --border-color: var(--md-sys-color-outline-variant);
  /* CATEGORY */
  ${({ $categoryPrimary, $categorySecondary, $categoryTertiary }) =>
    categoryColorCss($categoryPrimary, $categorySecondary, $categoryTertiary)}

  &.category {
    button.comment {
      color: var(--md-sys-color-on-surface);
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

    .quill {
      background-color: var(--background-color);
    }
  }

  .ql-editor.ql-blank::before {
    color: var(--md-sys-color-on-surface);
    opacity: 0.25;
  }

  .ql-editor {
    ol {
      padding-left: 0;
    }
  }

  /* custom mention styles */
  .ql-editor {
    .mention {
      border-radius: var(--border-radius-m);
      user-select: none;
      padding: 0 4px;
      /* remove underline */
      text-decoration: none;

      white-space: nowrap;
      cursor: pointer;

      color: var(--button-color);
      background-color: var(--button-color-secondary);

      &:hover {
        background-color: color-mix(in srgb, var(--button-color-secondary) 85%, white);
      }
      &:active {
        background-color: color-mix(in srgb, var(--button-color-secondary) 70%, white);
      }
    }
  }

  /* container styles reset */
  .ql-container.ql-snow {
    border: none;
    /* takes into account the top toolbar */
    height: calc(100% - 41px);

    .ql-editor {
      max-height: 259px !important;

      /* code block */
      .ql-code-block-container {
        background-color: var(--md-sys-color-surface-container-lowest);
        padding: var(--padding-m);
        border-radius: var(--border-radius-m);
      }

      .ql-code-block-container .ql-code-block,
      .ql-code-block-container .ql-code-block *,
      .ql-code-block-container * {
        font-family: monospace;
        font-size: var(--md-sys-typescale-body-small-font-size);
      }

      a {
        &::before,
        &::after {
          display: none;
        }

        color: var(--md-sys-color-primary);
      }

      a[href^='@'] {
        text-decoration: none;
        color: var(--md-sys-color-primary);
      }

      strong {
        em,
        u {
          font-weight: 800;
        }
      }
    }

    /* link popup */
    .ql-tooltip {
      &.ql-hidden {
        display: none;
      }

      left: 1px !important;
      top: -29px !important;

      width: 100%;

      box-shadow: none;
      background-color: var(--md-sys-color-surface-container-lowest);
      border-color: var(--md-sys-color-surface-container-low);
      border-radius: var(--border-radius-l);
      padding: 4px;
      overflow: hidden;

      display: flex;
      align-items: center;

      .ql-preview {
        flex: 1;
        max-width: unset;
      }

      input {
        flex: 1;
        border: none;
        background-color: var(--md-sys-color-surface-container-lowest);

        &:focus-visible {
          outline: none;
        }
      }

      a {
        color: var(--md-sys-color-primary);
      }

      /* remove before text */
      /* remove save button */
      &::before,
      .ql-action {
        display: none;
      }

      .ql-remove {
        color: var(--md-sys-color-on-surface-variant);
        margin-right: 4px;
      }
    }
  }

  /* CLOSED */
  &.isClosed {
    cursor: pointer;
    .ql-editor > * {
      cursor: pointer !important;
    }
    &:hover:not(.disabled) {
      background-color: var(--md-sys-color-surface-container-high);
    }

    .ql-container.ql-snow {
      padding-bottom: 0;
      height: 44px;

      .ql-editor {
        overflow: hidden;
      }
    }

    /* hide toolbar */
    .ql-toolbar.ql-snow {
      height: 0;
      padding: 0;
      margin: 0;
      border-width: 0;
      opacity: 0;
      pointer-events: none;
      overflow: hidden;
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

  &.isSubmitting {
    opacity: 0.3;
  }

  /* toolbar styles */
  .ql-toolbar.ql-snow {
    border: none;
    background-color: var(--background-color);
    border-bottom: 1px solid var(--md-sys-color-surface-container-hover);
    padding: var(--padding-s);
    display: flex;
    justify-content: flex-end;
    height: unset;
    width: unset;

    .ql-formats {
      height: 32px;
      margin-left: 8px;
      margin-right: 0;
      padding-left: 8px;
      border-left: 1px solid var(--md-sys-color-surface-container-hover);
      display: flex;
      gap: 2px;

      button {
        float: none;
        padding: 6px;
        border-radius: var(--border-radius-m);
        height: 32px;
        width: 32px;

        /* highlight when action */
        &.ql-active {
          background-color: var(--button-color-secondary);
          .icon {
            color: var(--button-color);
          }
        }
      }
    }

    button:hover {
      background-color: var(--button-color-secondary);
    }
  }

  /* EDITING */
  &.isEditing {
    /* remove box shadow */
    box-shadow: none;
    /* remove outline */
    outline: none;

    /* hide toolbar */
    .ql-toolbar.ql-snow {
      display: none;
    }

    .ql-container.ql-snow {
      height: 100%;

      .ql-editor {
        padding: 8px;
      }
    }
  }
`

export const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  padding: var(--padding-m);
  border-top: 1px solid var(--md-sys-color-surface-container-hover);
  background-color: var(--background-color);
  z-index: 100;

  /* remove save button icon */
  .comment {
    min-width: 75px;
    .icon {
      display: none;
    }
    background-color: var(--button-color);
  }
`

export const Buttons = styled.div`
  display: flex;
  gap: var(--base-gap-small);

  button {
    &.text {
      &:hover {
        background-color: var(--button-color-secondary);
      }
    }
  }
`

export const Markdown = styled.div`
  position: fixed;
  visibility: hidden;
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
