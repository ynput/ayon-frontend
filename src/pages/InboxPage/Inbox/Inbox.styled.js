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
export const LoadMore = styled.li`
  background-color: var(--md-sys-color-surface-container-low);
  padding: 0 var(--padding-l);
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  border-radius: 0 0 var(--border-radius-m) var(--border-radius-m);
  overflow: hidden;

  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
  }
`

export const NoMessages = styled.div`
  position: absolute;
  /* center */
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  user-select: none;

  .icon {
    font-size: 64px;
    padding: 8px;
    background-color: var(--md-sys-color-secondary-container);
    border-radius: 100%;
    color: var(--md-sys-color-on-secondary-container);
  }

  &.isError {
    .icon {
      color: var(--md-sys-color-error-on-container);
      background-color: var(--md-sys-color-error-container);
    }

    .error-message {
      color: var(--md-sys-color-error-container);
      background-color: var(--md-sys-color-on-error-container);
      padding: var(--padding-m) var(--padding-m);
      border-radius: var(--border-radius-m);
      user-select: text;
      margin-top: -16px;
    }
  }
`
