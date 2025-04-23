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

export const FeedContent = styled.ul`
  gap: var(--base-gap-large);
  overflow-y: auto;
  padding: 0;
  padding-bottom: 40px;
  scrollbar-gutter: stable;

  display: flex;
  flex-direction: column;

  flex-direction: column-reverse;

  &.loading {
    overflow: hidden;
  }
`

export const LoadMore = styled.span`
  padding: 16px 8px;
  color: var(--md-sys-color-outline);
  font-size: 11px;
`

export const Placeholder = styled.div`
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  margin: 8px 0;
  opacity: 0.5;

  position: relative;
`
