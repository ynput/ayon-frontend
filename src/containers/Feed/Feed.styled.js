import { getShimmerStyles } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const FeedContainer = styled.section`
  padding: 4px;
  padding-top: 0;
  overflow: hidden;
  position: relative;

  height: 100%;

  display: grid;
  grid-template-rows: 1fr auto;
  background-color: var(--md-sys-color-surface-container-low);
`

export const Warning = styled.div`
  position: absolute;
  left: 8px;
  right: 8px;
  top: 8px;
  z-index: 100;

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: var(--padding-m) var(--padding-s);
  border-radius: var(--border-radius-m);

  background-color: var(--md-sys-color-on-warning-container);
  color: var(--md-sys-color-warning-container);

  .icon {
    color: inherit;
  }
`

export const FeedContent = styled.div`
  gap: var(--base-gap-large);
  overflow-y: auto;
  padding-bottom: 40px;

  display: flex;
  flex-direction: column;

  flex-direction: column-reverse;

  &.isLoading {
    overflow: hidden;
  }
`

export const LoadMore = styled.span`
  padding: 16px 8px;
  color: var(--md-sys-color-outline);
  font-size: 11px;
`

export const Placeholder = styled.div`
  height: 100px;
  background-color: var(--md-sys-color-surface-container-low);
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0;

  position: relative;

  ${getShimmerStyles()}
`
