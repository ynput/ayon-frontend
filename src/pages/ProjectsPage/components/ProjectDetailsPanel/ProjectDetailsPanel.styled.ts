import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
`

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  > div {
    flex: unset;
    height: auto;
  }
`

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: var(--padding-m);
  gap: var(--base-gap-large);
`

export const HeaderTop = styled.div`
  display: flex;
  gap: var(--base-gap-large);
`

export const ThumbnailRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  position: relative;
`

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  justify-content: center;
  min-width: 0;

  h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--md-sys-color-on-surface);
    line-height: 1.3;
  }
`

export const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  background-color: var(--md-sys-color-surface-container-low);
`
