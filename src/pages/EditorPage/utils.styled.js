import styled, {css} from 'styled-components'

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

  ${({ $isUpdated }) => ($isUpdated && css`${updatedStyles}`)}
`


export const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  transition: opacity 0.3s ease-in-out;
  z-index: 99;
`;
