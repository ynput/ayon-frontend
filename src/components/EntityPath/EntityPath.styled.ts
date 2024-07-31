import { getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Path = styled.div`
  position: relative;
  border-radius: var(--border-radius-m);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--base-gap-small);
  user-select: none;
  color: var(--md-sys-color-outline);

  flex: 1;

  &.loading {
    overflow: hidden;
    & > * {
      opacity: 0;
      &::before {
        opacity: 0;
      }
    }

    ${getShimmerStyles()}
  }
`

export const Segment = styled.span`
  position: relative;
  cursor: pointer;
  padding: 0px 2px;
  border-radius: var(--border-radius-m);
  transition: color 0.2s, background-color 0.2s;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
    color: var(--md-sys-color-on-surface);
  }

  &.more {
    padding: 0px 6px;

    &:hover {
      background-color: var(--md-sys-color-surface-container-high);
    }
  }
`

export const MoreModal = styled.div`
  position: absolute;
  top: 100%;
  left: 0px;
  width: 100%;
  min-width: fit-content;

  z-index: 100;
  padding-top: 4px;
`

export const MoreList = styled.ul`
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  box-shadow: var(--md-sys-shadow-elevation-4);
  padding: var(--padding-s);
  list-style: none;

  overflow: hidden;
`

export const MoreItem = styled.li`
  padding: var(--base-gap-small);
  border-radius: var(--border-radius-m);

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }
`
