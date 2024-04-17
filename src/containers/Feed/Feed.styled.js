import styled from 'styled-components'

export const FeedContainer = styled.section`
  padding: 4px;
  overflow: hidden;
  position: relative;

  height: 100%;

  display: grid;
  grid-template-rows: 1fr auto;
  background-color: var(--md-sys-color-surface-container-low);
`

export const FeedContent = styled.div`
  gap: var(--base-gap-large);
  overflow-y: auto;
  padding-bottom: 40px;

  display: flex;
  flex-direction: column;

  flex-direction: column-reverse;
`

export const LoadMore = styled.span`
  padding: 8px;
  color: var(--md-sys-color-outline);
  font-size: 11px;
`
