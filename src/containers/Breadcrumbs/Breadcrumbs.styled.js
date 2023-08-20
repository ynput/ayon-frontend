import styled, { keyframes } from 'styled-components'

export const Wrapper = styled.div`
  position: absolute;
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
  gap: 8px;
`

const InputOpenAnimation = keyframes`
    from {
        scale: 0.95;
    }
    to {
        scale: 1;
    }
`

export const CrumbsForm = styled.form`
  *::before,
  *::after {
    box-sizing: border-box;
  }

  label {
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

      background-color: var(--md-sys-color-surface-container);
      border: 1px solid;
      border-color: transparent;
      transition: all 0.1s;
      font-size: var(--md-sys-typescale-label-large-font-size);
      max-height: unset;

      transform-origin: center;
      min-width: 0;
      text-align: center;
    }

    input {
      &:hover {
        background-color: var(--md-sys-color-surface-container-hover);
      }
    }

    &::after {
      content: attr(data-value);
      visibility: hidden;
      white-space: pre-wrap;
    }

    &:focus-within {
      input {
        background-color: var(--md-sys-color-secondary-container);
        background-color: var(--md-sys-color-surface-container-high);
        color: var(--md-sys-color-on-secondary-container);
        outline: none;
        border-color: var(--md-sys-color-outline);

        box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
      }
      &::after,
      input {
        /* font-size: var(--md-sys-typescale-title-small-font-size); */
        /* animate */
        animation: ${InputOpenAnimation} 0.05s forwards;
        transform-origin: center;

        /* padding: 8px; */
        /* transform: translateY(4px); */
        /* border-radius: 8px; */
      }
    }
  }
`
