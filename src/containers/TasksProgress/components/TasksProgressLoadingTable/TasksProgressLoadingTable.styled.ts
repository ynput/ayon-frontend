import styled from 'styled-components'

export const LoadingTable = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  padding-bottom: var(--padding-m);

  & > * {
    width: 100%;
  }
`

export const LoadingHeader = styled.div`
  min-height: 36px;
  background-color: var(--md-sys-color-surface-container-low);
`

export const LoadingRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 42px;
  padding: 0 var(--padding-m);

  & > * {
    height: 34px;
    border-radius: var(--border-radius-m);
    overflow: hidden;
  }

  .folder {
    width: 200px;
  }

  .completed {
    width: 108px;
  }

  .task {
    flex: 1;
  }
`
