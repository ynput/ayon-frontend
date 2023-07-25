import styled, { css } from 'styled-components'

const platformColors = {
  windows: '#00a2ed',
  linux: '#f47421',
  darwin: '#e9eff5',
}

export const PlatformTag = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  color: black;
  width: max-content;
  font-size: 11px;

  ${({ $platform }) => {
    // get platform color
    const color = platformColors[$platform?.toLowerCase()] || 'var(--color-grey-07)'

    return css`
      background-color: ${color};
    `
  }}
`
