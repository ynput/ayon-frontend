import styled from 'styled-components'

// the same inset as the tabs' search and filter bars (Activity), under the header's title
export const Wrapper = styled.div`
  padding: 0 8px;
`

// SearchFilter's bar in its compact size (ayon-react-components), so either one fits the header
export const Bar = styled.label`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  height: 28px;
  padding: 1px 6px;
  font-size: 12px;

  border-radius: var(--border-radius-m);
  border: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-low);
  cursor: text;

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }

  .icon.search {
    font-size: 20px;
  }

  .clear.hasIcon {
    padding: 1px;

    .icon {
      font-size: 16px;
    }
  }
`

export const Input = styled.input`
  /* strip native input chrome so it blends into the bar */
  appearance: none;
  border: none;
  background: none;
  font: inherit;
  color: inherit;

  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--md-sys-color-outline);
  }

  /* the bar has its own clear button */
  &::-webkit-search-cancel-button {
    display: none;
  }
`
