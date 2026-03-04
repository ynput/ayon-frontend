import styled from 'styled-components'
import { Dialog } from 'primereact/dialog'

export const FloatingDialog = styled(Dialog)`
  .p-dialog-header-icons {
    display: none;
  }
  .p-dialog-content {
  }
`

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: -8px;
  width: calc(100% + 16px);
  height: calc(100% + 16px);
`
export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  gap: var(--base-gap-large);
  z-index: 50;
  padding: var(--padding-m);

  &.loading {
    .playable {
      display: none;
    }
  }
`

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  position: relative;

  h2 {
    margin: 0;
  }

  h3 {
    display: block;
    margin: 0;
    border: none;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.loading {
    width: 70%;

    h2,
    h3,
    .sub-title {
      white-space: nowrap;
    }
  }

  .sub-title {
    display: flex;
    align-items: center;
    gap: var(--base-gap-medium);
  }
`

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  padding-top: 0;
`

export const FeedContainer = styled.div`
  border-top: solid 1px var(--md-sys-color-outline-variant);
  height: 100%;
  overflow: hidden;

  .feed {
    padding-bottom: 0;
    ul {
      margin: 0;
    }

    .comment-container {
      display: none;
    }

    .reactions-wrapper {
      display: none;
    }
  }
`

export const Status = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  padding: 0 8px;
  height: 32px;
  border-radius: var(--border-radius-m);

  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
  }
`
