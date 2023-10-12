import styled from 'styled-components'

export const FeedContainer = styled.section`
  padding: 8px;
  overflow: hidden;
  position: relative;

  height: 100%;

  display: grid;
  grid-template-rows: 1fr auto;

  ::after {
    content: 'Activity Feed Coming Soon';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: var(--md-sys-typescale-title-large-font-size);
  }

  & > * {
    opacity: 0.2;
  }
`

export const FeedContent = styled.div`
  padding: 8px;
  gap: 20px;
  overflow-y: auto;
  padding-bottom: 40px;

  display: flex;
  flex-direction: column;
`
