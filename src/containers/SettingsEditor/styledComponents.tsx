import styled from 'styled-components'

const CodeEditorWrapper = styled.div`
  position: relative;
  display: flex;
  resize: vertical;
  overflow: auto;
  flex-direction: column;
  min-height: 40px;
  height: 200px;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--border-radius-m);

  .wrap {
    position: relative;
    top: 0;
    left: 0;
    overflow: scroll;
  }
  .w-tc-editor {
    background-color: var(--md-sys-color-surface-container-low);
    flex-grow: 1;
    overflow: unset !important;
    * {
      background-color: var(--md-sys-color-surface-container-low);
      font-family: monospace !important;
      font-size: 12px;
    }
  }

  &.error {
    border: 1px solid var(--md-sys-color-error);
  }

  &.changed {
    border: 1px solid var(--md-sys-color-primary);
  }
  
`

export {CodeEditorWrapper}
