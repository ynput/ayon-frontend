import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Wrapper = styled.div`
  position: absolute;
  inset: 0;

  .tl-container__focused {
    outline: none;
  }
`

export const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);

  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 2px;
`

export const ToolButton = styled(Button)`
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  padding: 0;
  align-items: center;
  justify-content: center;

  background-color: unset;

  &.color {
    border-radius: 50%;
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container-active);
    border-color: var(--md-sys-color-primary);
  }
`

export const Color = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`

export const ToolsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
`

export const Divider = styled.hr`
  margin: 0;
  border: 0;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  width: 100%;
`

export const Slider = styled.div`
  position: absolute;

  border-radius: var(--border-radius-m);

  display: flex;
  justify-content: center;
  align-items: center;

  .p-slider {
    width: 100%;
  }

  left: -4px;
  translate: -100% -6px;
  height: 32px;
  width: 100px;
  background-color: red;
  z-index: 1000;
`
