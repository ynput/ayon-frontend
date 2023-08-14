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
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-primary-container);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  span {
    word-break: break-all;
    line-height: 100%;
  }

  ${({ $selected }) =>
    $selected &&
    css`
      &,
      &:hover {
        background-color: var(--md-sys-color-primary-container);
      }
    `}

  .icon {
    /* fill icon */
    ${({ $selected }) => ($selected ? 'font-variation-settings: "FILL" 1;' : '')}
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
