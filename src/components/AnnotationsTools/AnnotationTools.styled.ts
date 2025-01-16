import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const ToolbarContainer = styled.div`
  width: min-content;
  position: relative;
`

export const Toolbar = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  padding: 2px;
  width: fit-content;
  margin-bottom: 4px;
`

export const ToolsSection = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
  user-select: none;
  pointer-events: none;
`

export const ToolButton = styled(Button)`
  width: 32px;
  height: 32px;
  padding: 0;
  align-items: center;
  justify-content: center;

  &.surface {
    background-color: unset !important;
  }

  &.color {
    border-radius: 50%;
  }
`

export const Color = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`

export const Divider = styled.hr`
  margin: 0;
  border: 0;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  width: 100%;
`
