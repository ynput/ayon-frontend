import { AssigneeSelect, Button, Toolbar, Icon } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

export const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--base-gap-large);

  label {
    min-width: 120px;
  }

  .field {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: left;
    overflow: hidden;
    padding: 1px;
    margin: -1px;
  }
`

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

  width: 130px;

  /* hide when screen is smaller than 1250px */
  @media (max-width: 1250px) {
    display: none;
  }
`

export const MainToolbar = styled(Toolbar)`
  .small {
    display: none;
  }
  /* less than 1000px use small instead of large */
  @media (max-width: 1000px) {
    .large {
      display: none;
    }
    .small {
      display: in;
    }
  }
  /* less than 720px */
  @media (max-width: 720px) {
    .small {
      display: none;
    }
  }
`

export const AddonTools = styled.div`
  flex: none;
  max-width: max-content;
  /* 2x2 grid */
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: var(--base-gap-large);
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

export const LatestIcon = styled(Icon)`
  color: var(--md-sys-color-outline);
  margin-left: auto;
  &:hover {
    color: var(--md-sys-color-on-surface);
  }
`
