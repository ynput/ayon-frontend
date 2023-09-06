import styled from 'styled-components'

export const FeedContainer = styled.section`
  padding: 8px;
  overflow: hidden;

  height: 100%;

  display: grid;
  grid-template-rows: 1fr auto;
`

export const FeedContent = styled.div`
  padding: 8px;
  gap: 20px;
  overflow-y: auto;
  padding-bottom: 40px;

  display: flex;
  flex-direction: column;
`
