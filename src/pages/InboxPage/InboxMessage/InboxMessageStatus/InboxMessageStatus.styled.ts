import styled from 'styled-components'

export const MessageStatus = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  .icon {
    font-size: 18px;
    font-variation-settings: 'FILL' 1, 'wght' 300, 'GRAD' 300, 'opsz' 20;
  }
`

export const Name = styled.span`
  white-space: nowrap;
`
