import styled from 'styled-components'

export const Checkbox = styled.label`
  cursor: pointer;
  position: relative;
  right: 2rem;

  input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .icon {
    user-select: none;
    font-size: 24px;
    position: relative;
    top: -3px;
    position: absolute;
  }

  &.checked {
    .icon {
      color: var(--md-sys-color-tertiary);
      /* fill icon */
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
  }
`
