import { Button, Dropdown } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

export const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

export const ButtonColors = css`
  background-color: var(--md-sys-color-primary);

  &:hover {
    background-color: var(--md-sys-color-primary-hover, var(--md-sys-color-primary));
  }
  &,
  .icon {
    color: var(--md-sys-color-on-primary);
  }
`

export const DownloadButton = styled(Button)`
  border-radius: 4px 0 0 4px;
  flex: 1;
  max-height: unset;

  ${({ $isSpecial }) =>
    $isSpecial
      ? css`
          ${ButtonColors}
        `
      : css`
          padding: 8px;
        `}
`

export const InstallerDropdown = styled(Dropdown)`
  .button {
    background-color: var(--button-background);
    padding: 5.25px 8px;
    padding-right: 4px;
    height: unset;
    border-radius: 0 4px 4px 0;

    &:hover {
      background-color: var(--button-background-hover);
    }
  }

  ${({ $isSpecial }) =>
    $isSpecial
      ? css`
          .button {
            border-radius: 0;
            ${ButtonColors}
          }
        `
      : css`
          height: unset;
          .button {
            padding: 8px;
          }
        `}

  ${({ $noDirect }) =>
    $noDirect &&
    css`
      .button {
        border-radius: 4px;
        span:not(.icon) {
          flex: 1;
          text-align: left;
        }
      }
      flex: 1;
    `}
`

export const CloseButton = styled(Button)`
  border-radius: 0 4px 4px 0;
  left: -4px;
  position: relative;

  ${ButtonColors}
`

export const Value = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .icon {
    font-size: 1.5rem;
  }
`

export const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 224px;
  padding: 8px 12px;
  .icon {
    font-size: 1.5rem;
  }

  ${({ $highlight }) =>
    $highlight &&
    css`
      &,
      .icon {
        color: var(--color-hl-00);
      }
    `}
`
