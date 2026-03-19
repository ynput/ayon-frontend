import styled from 'styled-components'

const FormWrapper = styled.div<{ $currentSelection: string }>`
  [data-fieldid='${(props) => props.$currentSelection}'] {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .rjsf {
    flex-grow: 1;
    margin: 0;
    padding: 0;

    .form-root-field {
      animation-name: delay-visibility;
      animation-duration: 0.4s;
      animation-fill-mode: forwards;
      opacity: 0;

      @keyframes delay-visibility {
        to {
          opacity: 1;
        }
      }
    }

    .errors {
      display: none;
    }

    .switch-body {
      .slider {
        transition-duration: 0s;

        &::before {
          transition-duration: 0s;
        }
      }
    }
  }

  /* specific styles for activity categories */
  [data-schema-id='root_activity_categories'] {
    .form-object-field.layout-compact {
      gap: clamp(8px, 5%, 200px);
    }

    /* input type text */
    .form-inline-field {
      min-width: unset !important;
      .form-inline-field-label {
        flex-basis: unset;
      }
    }

    .form-inline-field-wrapper {
      width: unset !important;
      max-width: 500px;
    }

    .name-wrapper {
      flex: 1;
    }

    .access-control-wrapper {
      flex: 1;
    }
  }
`

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

export { FormWrapper, CodeEditorWrapper }
