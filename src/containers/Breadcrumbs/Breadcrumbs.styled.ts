import styled from 'styled-components'

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  inset: 0;
  flex: 1;
`

export const Crumbtainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  button {
    border-radius: 0 var(--border-radius-m) var(--border-radius-m) 0;
    z-index: 100;
  }
`

export const CrumbsForm = styled.form`
  background-color: var(--md-sys-color-secondary-container);
  border-radius: 4px 0 0 4px;
  display: inline-flex;
  *::before,
  *::after {
    box-sizing: border-box;
  }
  &:focus-within, &.noUri {
    border-radius: 4px;
  }
  &:hover {
    background-color: var(--md-sys-color-secondary-container-hover);
  }

  button, button:hover {
    display: inline-flex;
    background-color: transparent;
    padding: '6px';
  }

  label {
    z-index: 100;
    display: inline-grid;
    vertical-align: top;
    align-items: center;
    position: relative;
    padding: 0;
    grid-template-columns: 1fr;

    &::after,
    input {
      width: auto;
      grid-area: 1 / 2;
      font: inherit;
      padding: 4px 8px;
      margin: 0;
      resize: none;
      background: none;
      appearance: none;
      text-overflow: ellipsis;

      background-color: transparent;
      border: 1px solid;
      border-color: transparent;
      transition: all 0.1s;
      max-height: unset;
      transform-origin: center;
      min-width: 0;
      text-align: center;
      cursor: pointer;
      user-select: none;

      font-family: var(--md-sys-typescale-title-small-font-family-name);
      font-style: var(--md-sys-typescale-title-small-font-family-style);
      font-weight: var(--md-sys-typescale-title-small-font-weight);
      font-size: var(--md-sys-typescale-title-small-font-size);
      letter-spacing: var(--md-sys-typescale-title-small-letter-spacing);
      line-height: var(--md-sys-typescale-title-small-line-height);
    }


    &::after {
      content: attr(data-value);
      visibility: hidden;
      white-space: pre-wrap;
      height: 1rem;
    }

    &:focus-within {
      input {
        user-select: text;
        cursor: text;
        background-color: var(--md-sys-color-surface-container-high);
        color: var(--md-sys-color-on-secondary-container);
        outline: none;
        border-color: var(--md-sys-color-outline);

        box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
      }
    }
  }
`
