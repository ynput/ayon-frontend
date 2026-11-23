import styled from 'styled-components'

// lines up with the SearchFilter bar: icon after its 8px padding, text after the icon and gap
export const SearchField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;

  .search-icon {
    position: absolute;
    left: 9px;
    pointer-events: none;
  }

  input {
    flex: 1;
    width: 100%;
    min-width: 0;
    padding-left: 33px;

    &::placeholder {
      color: var(--md-sys-color-outline);
    }
  }

  &:has(input:disabled) .search-icon {
    opacity: 0.5;
  }
`
