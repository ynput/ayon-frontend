import styled, { css } from 'styled-components'

export const AutoHeight = styled.div`
  /* use grid tick for auto height transition */
  display: grid;
  height: 100%;
  transition: translate 0.1s, margin-top 0.1s;
  position: relative;
`

export const Comment = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;

  background-color: var(--md-sys-color-surface-container);
  outline: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-l);
  overflow: hidden;

  /* isOpen styles */
  ${({ $isOpen }) =>
    $isOpen
      ? css`
          /* box shadow */
          box-shadow: 0 -3px 10px 0 rgba(0, 0, 0, 0.2);

          .quill {
            background-color: var(--md-sys-color-surface-container-lowest);
          }
        `
      : css`
          cursor: pointer;
          .ql-editor > * {
            cursor: pointer !important;
          }
          &:hover {
            background-color: var(--md-sys-color-surface-container-hover);
          }
        `}

  .ql-editor.ql-blank::before {
    color: var(--md-sys-color-on-surface);
    opacity: 0.25;
  }

  .ql-bubble .ql-tooltip.ql-flip {
    left: 0 !important;
    top: 9px !important;
    position: fixed;
    translate: 0 calc(-100% - 4px);

    background-color: var(--md-sys-color-surface-container-lowest);
    outline: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 8px;

    .ql-tooltip-arrow {
      display: none;
    }
  }
`

export const Footer = styled.footer`
  display: flex;
  justify-content: space-between;
  padding: var(--padding-m);
  border-top: 1px solid var(--md-sys-color-outline-variant);

  /* remove save button icon */
  & > button.comment {
    .icon {
      display: none;
    }
  }
`

export const Commands = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

export const Markdown = styled.div`
  position: fixed;
  visibility: hidden;
`

export const Mention = styled.span`
  background-color: var(--md-sys-color-surface-container-high);
  padding: 4px;

  position: absolute;

  top: 0;
  right: 0;
`
