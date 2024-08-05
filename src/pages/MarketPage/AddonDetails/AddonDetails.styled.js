import { Button, Dropdown, Panel, getShimmerStyles } from '@ynput/ayon-react-components'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

export const PanelContainer = styled(Panel)`
  height: 100%;
  flex-wrap: wrap;

  flex: 1;
  max-width: 800px;
  min-width: 250px;
  padding: var(--padding-l);

  &.noData {
    background-color: unset;
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
  min-width: 200px;

  & > button {
    width: 100%;
  }

  &.isLoading > button {
    position: relative;
    overflow: hidden;
    background-color: unset;
    ${getShimmerStyles(undefined, undefined, { opacity: 1 })}
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

  /* loading styles */
  &.isPlaceholder {
    .titles > * {
      position: relative;
      ${getShimmerStyles(undefined, undefined, { opacity: 1 })}
      border-radius: var(--border-radius);
      overflow: hidden;
      margin: 1px 0;
    }
  }
`

// description in the left column
export const Description = styled(ReactMarkdown)`
  position: relative;
  /* loading styles */
  &.isPlaceholder {
    color: transparent;
    ${getShimmerStyles(
      'var(--md-sys-color-surface-container)',
      'var(--md-sys-color-surface-container-high)',
      { opacity: 1 },
    )}
    border-radius: var(--border-radius);
    min-height: 80px;
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

  &.isPlaceholder {
    ${getShimmerStyles(
      'var(--md-sys-color-surface-container)',
      'var(--md-sys-color-surface-container-high)',
      { opacity: 1 },
    )}
    border-radius: var(--border-radius-m);
  }
`

export const MetaPanelRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  .link {
    text-decoration: underline;
  }

  .value {
    display: flex;
    flex-direction: column;
  }

  .more:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

export const UseButton = styled(Button)`
  padding: 2px 6px;
  width: fit-content;
  margin-left: auto;
  gap: var(--base-gap-small);
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
