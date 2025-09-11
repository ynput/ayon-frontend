import styled from 'styled-components'

export const StyledContent = styled.div`
  padding: 0;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;

  &.editing {
    cursor: default;
    padding: 0;
    margin: 0;
  }
`

export const StyledDescription = styled.div`
  color: var(--md-sys-color-on-surface);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;

  &.empty {
    color: var(--md-sys-color-on-surface-variant);
    font-style: italic;
  }
`

export const StyledEditor = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;

  .ql-toolbar.ql-snow {
    height: 40px;
    border: none;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    padding: 4px;
    display: flex;
    width: unset;

    .ql-formats {
      margin-right: 8px;
      padding-right: 8px;
      border-right: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      gap: var(--base-gap-small);

      &:last-child {
        border-right: none;
      }
    }

    button {
      float: none;
      height: 32px;
      width: 32px;
      border-radius: var(--border-radius-m);
      transition: all 0.2s ease;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;

      /* Base styling matching activity section */
      &,
      .icon {
        color: var(--md-sys-color-on-surface);
      }

      &.ql-active {
        background-color: var(--md-sys-color-secondary-container);

        .icon {
          color: var(--md-sys-color-on-secondary-container);
          font-weight: 600;
        }
      }

      &:hover {
        background-color: var(--md-sys-color-surface-container-high-hover);
      }

      &:hover.ql-active {
        background-color: var(--md-sys-color-secondary-container-hover);
      }

      /* Special styling for header dropdown when active - matching activity reference styling */
      &.ql-picker.ql-active {
        background-color: var(--md-sys-color-secondary-container);
        border: 1px solid var(--md-sys-color-outline);
        border-radius: var(--border-radius-m);

        .ql-picker-label {
          color: var(--md-sys-color-on-secondary-container);
          font-weight: 600;
        }
      }

      /* Picker dropdown styling to match activity section */
      &.ql-picker {
        background-color: var(--md-sys-color-surface-container-high);
        border-radius: var(--border-radius-m);

        &:hover {
          background-color: var(--md-sys-color-surface-container-high-hover);
        }

        &:active {
          background-color: var(--md-sys-color-surface-container-high-active);
        }
      }
    }
  }

  .ql-container.ql-snow {
    border: none;
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: calc(100% - 57px);

    .ql-editor {
      padding: 12px;
      min-height: 60px;
      flex: 1;
      overflow-y: auto;

      &.ql-blank::before {
        color: var(--md-sys-color-on-surface-variant);
        opacity: 0.6;
        font-style: italic;
      }

      .ql-code-block-container {
        background-color: var(--md-sys-color-surface-container-lowest);
        padding: var(--padding-m);
        border-radius: var(--border-radius-m);
      }

      a {
        color: var(--md-sys-color-primary);
        text-decoration: none;
      }

      strong {
        em,
        u {
          font-weight: 800;
        }
      }

      /* Match activity section typography */
      h1 {
        font-size: 24px;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      h2 {
        font-size: 20px;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      h3 {
        font-size: 16px;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      p {
        word-break: break-word;
        margin-bottom: 8px;
      }

      ul,
      ol {
        margin: 16px 0;
        padding-left: 20px;
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
    }
  }
`

export const StyledFooter = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 8px;
  height: 48px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

export const StyledMarkdown = styled.div`
  .markdown-content {
    color: var(--md-sys-color-on-surface);
    line-height: 1.5;
    white-space: normal; /* prevent preserved newlines from adding extra gaps compared to editor */

    /* Normalize spacing to match the editor */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-size: 20px;
      margin-top: 16px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    /* Match editor heading sizes: Quill uses ~1.5em for H2 */
    h1 {
      font-size: 1.5rem;
    }
    h2 {
      font-size: 1.5em;
    }
    h3 {
      font-size: 1.125rem;
    }

    /* Avoid big gaps created by consecutive blank paragraphs */
    p {
      margin: 0 0 6px 0;
      &:last-child {
        margin-bottom: 0;
      }
    }

    pre {
      background-color: var(--md-sys-color-surface-container-lowest);
      padding: 8px;
      border-radius: var(--border-radius-m);
      overflow-x: auto;
      margin: 0;
      letter-spacing: 0.25px;
    }

    strong em {
      font-weight: 800 !important;
    }

    blockquote {
      border-left: 3px solid var(--md-sys-color-outline);
      margin: 8px 0;
      padding-left: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    ul,
    ol {
      margin: 16px 0;
      padding-left: 20px !important;
    }

    /* Remove extra vertical gap when markdown renders mixed list types consecutively */
    ul + ul,
    ul + ol,
    ol + ul,
    ol + ol {
      /* Use a negative top margin to cancel the previous list's bottom margin (margin-collapsing) */
      margin-top: -16px;
    }

    ol li {
      list-style-type: decimal !important;
      list-style-position: inside !important;
    }

    ul li {
      list-style-type: circle !important;
      list-style-position: inside !important;
    }

    a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }
  }
`

export const StyledLoadingSkeleton = styled.div`
  height: 20px;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 4px;
`

export const StyledMultipleValues = styled.span`
  color: var(--md-sys-color-on-surface-variant);
  font-style: italic;
`

export const StyledButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`

export const StyledQuillContainer = styled.div`
  height: 100%;
`
