import styled from 'styled-components'

export const TooltipWidget = styled.div`
  position: fixed;
  z-index: 3000;

  transition: opacity 300ms;
  /* how far up the tooltip us */
  padding-bottom: 4px;

  max-width: 400px;
`

export const TooltipInner = styled.div`
  background-color: var(--md-sys-color-surface-container-lowest);
  border-radius: var(--border-radius-m);
  border: solid 1px var(--md-sys-color-outline-variant);
  padding: 8px;
  margin: 0;
  max-width: 400px;
  overflow: hidden;

  p {
    margin: 0;
  }

  a {
    color: var(--md-sys-color-primary);
    text-decoration: underline;
  }

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  white-space: break-spaces;

  /* box shadow */
  box-shadow: 0 0 10px 0px rgba(0, 0, 0, 0.4);
  z-index: 1200;
`
