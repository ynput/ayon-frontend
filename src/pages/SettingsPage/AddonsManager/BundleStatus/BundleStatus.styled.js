import styled, { css } from 'styled-components'

const marks = css`
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

export const StatusDots = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  width: 100%;

  ${marks}
`

export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--md-sys-color-on-surface-variant);

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  ${marks}
`
