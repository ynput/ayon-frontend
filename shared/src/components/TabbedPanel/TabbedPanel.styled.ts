import styled from 'styled-components'

// The frame fills what the panel gives it; the open tab fills the rest and scrolls in itself
export const Panel = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
`

// the title on the left, the tools on the right, top-aligned: a two-line title keeps them at the top
export const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--base-gap-small);
  min-height: 40px;
  padding: var(--padding-m) var(--padding-m) 0;
  flex: none;
`

export const Title = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`

export const Tools = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
  margin-left: auto;
`

// what comes before the tabs and the tab bar
export const Head = styled.div`
  display: flex;
  flex-direction: column;
  flex: none;
`

// the tab bar, and the tools when the panel has no title
export const TabRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);

  & > :first-child {
    flex: 1;
    min-width: 0;
  }
`
