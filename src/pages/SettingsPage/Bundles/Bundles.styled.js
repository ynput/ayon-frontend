import { AssigneeSelect, Button } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

const platformColors = {
  windows: '#00a2ed',
  linux: '#f47421',
  darwin: '#e9eff5',
}

export const PlatformTag = styled.span`
  padding: 2px 4px;
  border-radius: 4px;
  color: black;
  width: max-content;
  font-size: 10px;

  ${({ $platform }) => {
    // get platform color
    const color = platformColors[$platform?.toLowerCase()] || 'var(--md-sys-color-outline)'

    return css`
      background-color: ${color};
    `
  }}
`

// hl prop for background
export const BadgeButton = styled(Button)`
  ${({ $hl }) =>
    $hl &&
    css`
      gap: 2px;
      background-color: ${`var(--color-hl-${$hl})`};
      color: black;

      .icon {
        color: black;
      }

      &:hover {
        background-color: ${`var(--color-hl-${$hl})`};
        background-color: ${`var(--color-hl-${$hl}-hover)`};
      }
      &:disabled:hover {
        background-color: ${`var(--color-hl-${$hl})`};
      }
    `}

  width: 140px;
`

export const AddonTools = styled.div`
  flex: none;
  max-width: max-content;
  /* 2x2 grid */
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  padding-top: 1px;
  padding-right: 1px;

  button {
    height: 36px;
    justify-content: flex-start;
    padding: 4px 16px;
  }
`

export const FilePath = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  width: 100%;
  padding-left: 4px;
  align-items: center;
`
export const DevSelect = styled(AssigneeSelect)`
  min-width: 200px;

  .button {
    border: 1px solid var(--md-sys-color-outline-variant);
    height: 32px;
  }
`
