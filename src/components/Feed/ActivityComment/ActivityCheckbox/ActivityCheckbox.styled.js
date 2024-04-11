import styled from 'styled-components'

export const Checkbox = styled.label`
  cursor: pointer;
  height: 24px;
  margin-right: 4px;
  position: relative;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .icon {
    user-select: none;
    font-size: 24px;
  }

  &.checked {
    .icon {
      color: var(--md-sys-color-tertiary);
      /* fill icon */
      font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
    }
  }
`
