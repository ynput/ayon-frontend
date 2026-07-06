import styled from 'styled-components'

export const FeedContainer = styled.section`
  padding-bottom: 4px;
  overflow: hidden;
  position: relative;

  height: 100%;

  display: grid;
  grid-template-rows: 1fr auto;
  background-color: var(--md-sys-color-surface-container-low);

  padding-top: 4px;
  /* fade out the content at the top with a gradient */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 45px;
    background: linear-gradient(
      to bottom,
      var(--md-sys-color-surface-container-low) 20%,
      rgba(255, 255, 255, 0) 100%
    );
    z-index: 1;
  }
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
  padding: 24px 0;
  margin: 0;
  padding-bottom: 40px;
  scrollbar-gutter: stable;

  display: flex;
  flex-direction: column;

  flex-direction: column-reverse;

  &.loading {
    overflow: hidden;
  }

  /* first (last in dom) has margin to separate from filter */
  & > *:last-child {
    margin-top: 32px;
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
