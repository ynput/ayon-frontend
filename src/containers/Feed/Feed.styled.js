import styled from 'styled-components'

export const FeedContainer = styled.section`
  padding: 8px;
  overflow: hidden;
  position: relative;

  height: 100%;

  display: grid;
  grid-template-rows: 1fr auto;
`

export const FeedContent = styled.div`
  gap: var(--base-gap-large);
  overflow-y: auto;
  padding-bottom: 40px;

  display: flex;
  flex-direction: column;
`
