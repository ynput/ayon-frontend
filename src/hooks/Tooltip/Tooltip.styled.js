import styled from 'styled-components'

export const TooltipWidget = styled.div`
  position: fixed;
  background-color: hsl(0, 0%, 5%);
  border-radius: var(--border-radius-m);

  transition: opacity 300ms;

  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  white-space: nowrap;

  /* box shadow */
  box-shadow: 0 0 10px 0px rgba(0, 0, 0, 0.4);
  user-select: none;
  pointer-events: none;
  z-index: 1200;

  /* tooltip triangle pointer using ::after */
  &::after {
    content: '';
    position: fixed;

    left: ${(props) => props?.$targetPos?.x}px;
    top: ${(props) => props?.$targetPos?.y}px;

    translate: 0 -100%;

    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: hsl(0, 0%, 5%) transparent transparent transparent;
  }
`

export const Shortcut = styled.span`
  background-color: var(--md-sys-color-surface-container-high);
  padding: 2px 4px;
  border-radius: var(--border-radius-m);
  font-size: 110%;
`
