import styled from 'styled-components'

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
`
