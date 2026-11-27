import styled from 'styled-components'

// A raw settings dialog's content: a line about what is edited, the editor, any error
export const DialogBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--base-gap-large);
  min-height: 0;
`

export const DialogSubtitle = styled.div`
  color: var(--md-sys-color-on-surface-variant);
  font-family: monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
`

export const DialogFooter = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  justify-content: flex-end;
  width: 100%;

  .spacer {
    flex: 1;
  }
`

// Holds the frame and anything laid over it (the low-level editor's warning)
export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 200px;
`

// The editor grows with its content (@uiw/react-textarea-code-editor): the frame takes the
// dialog's room and scrolls it
export const Frame = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-low);

  &:focus-within {
    border-color: var(--md-sys-color-primary);
  }

  &.has-error {
    border-color: var(--md-sys-color-error);
  }

  /* behind a warning: still there to see, not to read or edit */
  &.is-locked {
    filter: blur(3px);
    opacity: 0.5;
    user-select: none;
  }

  .w-tc-editor {
    min-height: 100%;
    background-color: transparent;
    color: var(--md-sys-color-on-surface);
  }

  /* The coloured copy is drawn under the textarea and has to match it character for character:
     the app's own font reaches its spans otherwise, and an indent no longer lines up */
  .w-tc-editor,
  .w-tc-editor * {
    font-family: monospace !important;
    font-size: 12px !important;
  }

  /* JSON coloured from the app's tokens: the editor's own palette follows the system's light or
     dark mode, not the app's, and gives keys and strings one colour. Doubled: the editor's
     colours come with pre[class*='language-'] */
  && .w-tc-editor .token {
    &.property {
      color: var(--md-sys-color-primary);
    }
    &.string {
      color: var(--md-sys-color-tertiary);
    }
    &.number,
    &.boolean {
      color: var(--md-sys-color-warning);
    }
    &.null {
      color: var(--md-sys-color-outline);
    }
    &.punctuation,
    &.operator {
      color: var(--md-sys-color-on-surface-variant);
    }
  }
`

export const ErrorMessage = styled.div`
  color: var(--md-sys-color-error);
  font-size: 12px;
`
