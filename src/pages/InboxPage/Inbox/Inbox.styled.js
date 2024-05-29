import { Section, Toolbar } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Tools = styled(Toolbar)`
  padding: var(--padding-s) var(--padding-m);
`

export const InboxSection = styled(Section)`
  padding: var(--padding-m);
  padding-top: 0;

  overflow: hidden;
  align-items: flex-start;

  & > * {
    width: unset;
  }

  .inbox-details-panel {
    max-width: clamp(550px, 33vw, 800px);
    min-width: clamp(550px, 33vw, 800px);
    position: relative;
    height: 100%;
  }
`

export const MessagesList = styled.ul`
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;

  /* reset defaults */
  list-style-type: none;
  margin: 0;
  padding: 0;
  flex: 1;

  border-radius: var(--border-radius-m);

  /* remove focus outline */
  &:focus-visible {
    outline: none;
  }

  &.isLoading {
    overflow: hidden;
  }
`

export const UnreadCount = styled.div`
  padding: 0 var(--padding-s);
  border-radius: var(--border-radius-m);
  margin-right: -8px;
  background-color: var(--md-sys-color-surface-container-high);

  &.important {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
`
