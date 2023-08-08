import styled, { css, keyframes } from 'styled-components'

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

export const AddonCard = styled.div`
  display: flex;
  padding: 8px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  cursor: pointer;
  user-select: none;

  border-radius: 4px;
  background: ${({ $selected }) => ($selected ? 'var(--color-hl-00)' : 'var(--button-background)')};
  color: ${({ $selected }) => ($selected ? 'black' : 'white')};

  .icon {
    color: ${({ $selected }) => ($selected ? 'black' : 'white')};
    /* fill icon */
    ${({ $selected }) => ($selected ? 'font-variation-settings: "FILL" 1;' : '')}
  }

  &:hover {
    background: ${({ $selected }) =>
      $selected ? 'var(--color-hl-00)' : 'var(--button-background-hover)'};
  }

  ${({ $error }) =>
    $error &&
    css`
      background: var(--color-hl-error);
      color: black;
      .icon {
        color: black;
      }

      &:hover {
        background: var(--color-hl-error);
      }
    `}

  .error {
    margin-left: auto;
  }

  ${({ $isSyncing }) =>
    $isSyncing &&
    css`
      .icon {
        animation: ${spin} 1s linear infinite;
      }
    `}
`
