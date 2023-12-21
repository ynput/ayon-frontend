import { Panel, getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const PanelContainer = styled(Panel)`
  height: 100%;
  flex-wrap: wrap;

  flex: 1;
  max-width: 600px;
  min-width: 300px;

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
      ${getShimmerStyles(undefined, undefined, { opacity: 1 })}
      border-radius: var(--border-radius);
    }
  }
`

// description in the left column
export const Description = styled.div`
  /* loading styles */
  &.isPlaceholder {
    color: transparent;
    ${getShimmerStyles()}
    border-radius: var(--border-radius);
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
  width: 100%;

  background-color: var(--md-sys-color-surface-container);
`

export const MetaPanelRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  .value {
    display: flex;
    flex-direction: column;
  }

  .more:hover {
    cursor: pointer;
    text-decoration: underline;
  }
`
