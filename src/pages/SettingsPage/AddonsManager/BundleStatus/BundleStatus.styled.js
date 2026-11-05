import styled from 'styled-components'

export const StatusDots = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  width: 100%;

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .error {
    font-size: 16px;
    color: var(--md-sys-color-error);
  }
`
