import styled from 'styled-components'

export const StyledContent = styled.div`
  padding: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;

  &.editing {
    cursor: default;
    padding: 0;
    margin: 0;
    height: auto;
    min-height: 300px;
  }

  /* viewing: the whole description is a button to start editing */
  &:not(.editing) {
    cursor: pointer !important;

    * {
      cursor: pointer !important;
    }
  }
`

// Wraps a MarkdownEditor
export const StyledEditor = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  .md-editor {
    flex: 1;
    background-color: transparent;
  }

  /* .md-editor raises specificity over the editor's own styles */
  .md-editor .md-content {
    padding: 12px;
  }

  .md-editor .md-placeholder {
    top: 12px;
    left: 12px;
    font-style: italic;
  }

  &.compact .md-editor {
    .md-content {
      padding: 6px var(--padding-s);
    }
    .md-placeholder {
      top: 6px;
      left: var(--padding-s);
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

export const StyledLoadingSkeleton = styled.div`
  height: 20px;
  background: var(--md-sys-color-surface-container-low);
  border-radius: 4px;
`

export const StyledButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`
