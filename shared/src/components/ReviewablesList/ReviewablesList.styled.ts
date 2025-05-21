import styled from 'styled-components'

export const ReviewablesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  min-height: 100%;
  padding-bottom: var(--padding-m);
`

export const LoadingCard = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: var(--border-radius-m);
  width: 100%;
  min-height: 50px;
`

export const RenameTitle = styled.div`
  word-break: break-all;
`
