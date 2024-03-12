import styled from 'styled-components'

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--padding-l);
  border-radius: var(--border-radius-l);
  overflow: hidden;

  background-color: var(--md-sys-color-surface-container-low);
  /* border: 1px solid var(--md-sys-color-surface-container-low); */

  flex: 1;

  &.featured {
    background-color: var(--md-sys-color-secondary-container);
    border-color: var(--primary-color);
  }

  svg {
    width: 40px;
    height: 40px;
    fill: var(--md-sys-color-on-surface);
  }
`

export const DownloadLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap);
  margin-top: var(--base-gap);

  overflow: hidden;
  width: 100%;

  button {
    white-space: pre-wrap;
  }
`
