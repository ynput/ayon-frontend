import styled, { keyframes } from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Button } from '@ynput/ayon-react-components'

export const DropColumnWrapper = styled.div`
  position: absolute;
  width: 100%;

  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.drop-active {
    z-index: 100;
  }
`

const FadeInAnimation = keyframes`
  from {
    opacity: 0;
    scale: 0.95;
  }
  to {
    opacity: 1;
    scale: 1;
  }
`

export const DropColumn = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 16px;

  .title {
    z-index: 100;
    background-color: ${({ $color }) => $color};
    padding: var(--padding-l);
    border-radius: var(--border-radius-xxl);
    box-shadow: 0 0 10px 0px #0000002b;
    display: flex;
    align-items: center;
    flex-direction: column;
    min-width: 75%;
    animation: ${FadeInAnimation} 100ms ease-in-out forwards;

    span:first-child {
      font-size: var(--md-sys-typescale-title-medium-font-size);
    }
  }
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: ${({ $color }) => $color};
    opacity: 0.08;
    transition: opacity 0.2s ease;
  }

  &.source {
    &:before {
      opacity: 1;
    }

    opacity: 0.4;
  }

  &.drop-active {
    &::before {
      opacity: 0.5;
    }
  }
`

export const Column = styled.div`
  --min-height: 125px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  height: min-content;
  min-width: 234px;
  min-height: var(--min-height);
  max-height: -webkit-fill-available;
  max-height: 100%;
  padding: 0;
  flex: 0;

  border-radius: 16px;
  background-color: var(--md-sys-color-surface-container-low);

  /* when a card is hovering over the top */
  .items > *:last-child {
    margin-bottom: 0;
    transition: margin-bottom 0.1s ease-in-out;
  }

  transition: opacity 0.1s ease-in-out;
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  z-index: 10;
  position: relative;

  h2 {
    margin: 0;
    /* text-align: center; */
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: opacity 50ms;
  }

  width: 100%;
  border-bottom: solid 1px var(--md-sys-color-outline);
  border-color: ${({ $color }) => $color};
  margin-bottom: 8px;

  &.dragging {
    border: none;
  }

  /* toolbar */
  nav {
    position: absolute;
    inset: 0;
    justify-content: flex-end;
    padding: 0 6px;
    gap: var(--base-gap-small);

    button {
      /* toolbar is only revealed on hover */
      opacity: 0;
    }

    /* buttons inside of toolbar */
    button {
      padding: 4px;
      border-radius: var(--border-radius-xl);
      background-color: var(--md-sys-color-surface-container-low);

      &:hover {
        background-color: var(--md-sys-color-surface-container-low-hover);
      }
      &:active {
        background-color: var(--md-sys-color-surface-container-low-active);
      }
    }
  }

  /* reveal toolbar on hover */
  &:hover {
    nav {
      button {
        opacity: 1;
      }
    }
  }
`

export const GroupHeader = styled.span`
  overflow: hidden;
  word-break: break-all;
  padding: 0 4px;
  min-height: 20px;
`

export const MenuButton = styled(Button)`
  padding: 4px;
  border-radius: var(--border-radius-xl);

  /* when the menu is open */
  &.open {
    opacity: 1;
    background-color: var(--md-sys-color-surface-container-high);
  }
`

export const Items = styled(PerfectScrollbar)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--base-gap-large);
  width: 100%;

  padding-bottom: ${({ $isScrolling }) => ($isScrolling ? '30px' : '16px')};

  &.dragging {
    .ps__rail-y {
      visibility: hidden;
    }
  }

  .ps__rail-y {
    z-index: 1000;

    .ps__thumb-y {
      background-color: var(--md-sys-color-surface-container-high) !important;
    }

    &:hover,
    &.ps--clicking {
      background-color: unset !important;
      .ps__thumb-y {
        background-color: var(--md-sys-color-surface-container-highest) !important;
        width: 8px !important;
      }
    }
  }
`

export const CollapsedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: unset;
  height: 100%;

  /* every child not the last */
  & > *:not(:last-child) {
    padding-bottom: 32px;
    border-radius: 16px 16px 0 0;
  }
`

export const Collapsed = styled.div`
  user-select: none;
  padding: 8px;
  padding-top: 7px;
  padding-bottom: 16px;
  border-radius: 16px;
  background-color: var(--md-sys-color-surface-container-low);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--base-gap-large);
  position: relative;

  border-top: solid 1px ${({ $color }) => $color};

  cursor: pointer;

  h2 {
    /* text side ways */
    writing-mode: vertical-rl;
    margin: 0;
  }

  .icon,
  h2 {
    color: var(--md-sys-color-outline);
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-low-hover);
    h2,
    .icon {
      color: var(--md-sys-color-on-surface);
    }
  }
`
