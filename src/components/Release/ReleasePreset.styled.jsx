import styled, { css } from 'styled-components'
import getShimmerStyles from '/src/styles/getShimmerStyles'

export const Preset = styled.li`
  display: flex;
  padding: 8px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  align-self: stretch;
  user-select: none;
  cursor: pointer;
  overflow: hidden;
  margin: 0;
  position: relative;

  border-radius: 4px;
  /* background: var(--ayon-sys-dark-primary-container, #004b70); */
  background: ${({ $selected }) => ($selected ? 'var(--color-hl-00)' : 'var(--button-background)')};
  color: ${({ $selected }) => ($selected ? 'black' : 'white')};

  .icon {
    color: ${({ $selected }) => ($selected ? 'black' : 'white')};
  }

  &:hover {
    background: ${({ $selected }) =>
      $selected ? 'var(--color-hl-00)' : 'var(--button-background-hover)'};
  }

  ${({ $loading }) =>
    $loading &&
    css`
      /* hide all text */
      & > * {
        visibility: hidden;
        user-select: none;
        pointer-events: none;
      }

      /* add shimmer */
      ${getShimmerStyles(undefined, undefined, { opacity: 0.5 })}
    `}
`

export const Header = styled.header`
  display: flex;
  padding: 0px 8px;
  align-items: center;
  gap: 16px;
  align-self: stretch;

  .icon {
    font-size: 30px;
  }

  div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    flex: 1 0 0;

    h3 {
      font-size: 16px;
      border: none;
      margin: 0;
      padding: 0;
      /* font-weight: bold; */
    }
  }
`

export const Addons = styled.span`
  &,
  & span {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
`
