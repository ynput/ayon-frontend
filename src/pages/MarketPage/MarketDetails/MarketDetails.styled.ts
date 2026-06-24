import { Button, Dropdown, Panel, theme } from '@ynput/ayon-react-components'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

export const PanelContainer = styled(Panel)`
  height: 100%;
  flex-wrap: wrap;
  overflow-x: auto;

  flex: 1;
  max-width: 800px;
  min-width: 250px;
  padding: var(--padding-l);

  &.noData {
    background-color: unset;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: var(--base-gap-large);
  }
`

// contains main body of content like, icon. title, description, etc
export const Left = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  flex: 1.5;
  min-width: 200px;
  overflow: hidden;
  height: 100%;

  .description {
    overflow: auto;
    height: 100%;
    * {
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    min-width: 100%;
    width: 100%;
    height: auto;
  }
`

// contains buttons like install, update, etc
// and metadata like version, etc
export const Right = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--base-gap-large);
  flex: 1;
  max-width: 300px;
  min-width: 250px;
  overflow-y: auto;
  flex-shrink: 0;

  & > button {
    width: 100%;
  }

  @media (max-width: 768px) {
    max-width: 100%;
    min-width: 100%;
    width: 100%;
  }
`

export const Download = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  width: 100%;

  button {
    flex: 1;
  }
`

export const VersionDropdown = styled(Dropdown)`
  button {
    background-color: var(--md-sys-color-surface-container-highest);
    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }

    & > div {
      padding: 0 6px;
      border: none;
      & > div {
        display: none;
      }
    }
  }
`

export const VersionDropdownItem = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0px 8px;
  padding-right: 16px;
`

// header is in the left column and contains icon, title and verification status
export const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--base-gap-large);
  width: 100%;

  .titles {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;

    h2 {
      margin: 0;
    }
  }

  .verification {
    display: flex;
    align-items: center;
    gap: var(--base-gap-small);
  }

  .verified {
    color: var(--md-sys-color-primary);
  }

  .official {
    color: var(--md-sys-color-tertiary);
  }
`

// meta panel in the right column
// it's reused down the right column
export const MetaPanel = styled.div`
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  width: 100%;
  position: relative;
  background-color: var(--md-sys-color-surface-container);
`

export const MetaPanelRow = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: var(--base-gap-small);

  .link {
    text-decoration: underline;
  }

  .value {
    display: flex;
    flex-direction: column;
    min-height: 24px;
  }

  .more:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

export const UseButton = styled(Button)`
  padding: 2px 6px;
  width: 100%;
  max-width: fit-content;
  justify-content: start;
  gap: var(--base-gap-small);
  span {
    width: auto;
    overflow: hidden;
    white-space: nowrap;
    display: block;
    text-overflow: ellipsis;
  }

  .label {
    flex: 1;
  }
`

export const ErrorCard = styled(Panel)`
  color: var(--md-sys-color-on-error-container);
  background-color: var(--md-sys-color-error-container);
  align-items: center;
  max-width: 300px;

  button {
    border: var(--md-sys-color-on-error-container) 1px solid;
  }
`

export const ExternalLInk = styled.a`
  display: flex;
  align-items: start;
  padding: 2px 6px;
  width: 100%;
  justify-content: start;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-m);
  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }
  span {
    width: auto;
    overflow: hidden;
    white-space: nowrap;
    display: inline;
    text-overflow: ellipsis;
    &.label {
      flex: 1;
    }
  }
`

export const ReleaseAddons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  flex-wrap: wrap;
`

export const ReleaseAddonLink = styled(Link)`
  position: relative;
  cursor: pointer;
  ${theme.bodySmall}
  user-select: none;
  color: var(--md-sys-color-outline);
  padding: var(--padding-s) var(--padding-m);
  border-radius: var(--border-radius-m);
  border: solid 1px var(--md-sys-color-outline-variant);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);
  }

  &.loading {
    border-color: transparent;
  }
`

export const Tags = styled.div`
  display: flex;
  gap: var(--base-gap-large);
  flex-wrap: wrap;
`

export const BetaTag = styled.div`
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--border-radius-l);
  padding: 2px 4px;
  color: var(--md-sys-color-outline);
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container);
  }
`
