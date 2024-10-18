import styled from 'styled-components'

const FormWrapper = styled.div<{$currentSelection: string}>`
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
`
export { FormWrapper }
