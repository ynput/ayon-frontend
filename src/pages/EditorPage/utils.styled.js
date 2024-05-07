import styled, { css } from 'styled-components'

const updatedStyles = css`
  background-color: var(--color-changed);
  outline: 1px solid var(--color-changed);
  color: var(--md-sys-color-on-primary);
  border-radius: var(--border-radius-m);
  > .icon {
    color: var(--md-sys-color-on-primary);
  }
`

export const StyledStatus = styled.div`
  display: flex;
  width: fit-content;
  color: ${({ $color }) => $color};

  > .statusName {
    margin-left: 8px;
    padding-right: 8px;
  }

  > .icon {
    font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
    color: ${({ $color }) => $color};
  }

  ${({ $isUpdated }) =>
    $isUpdated &&
    css`
      ${updatedStyles}
    `}
`
