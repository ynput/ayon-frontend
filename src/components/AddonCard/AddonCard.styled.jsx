import styled, { css } from 'styled-components'

export const AddonCard = styled.div`
  display: flex;
  padding: 8px;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;
  min-height: 40px;

  & > * {
    z-index: 1;
  }

  border-radius: 4px;
  background: ${({ $selected }) => ($selected ? 'var(--color-hl-00)' : 'var(--button-background)')};

  .icon {
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

      &:hover {
        background: var(--color-hl-error);
      }
    `}

  .error {
    margin-left: auto;
  }
`
