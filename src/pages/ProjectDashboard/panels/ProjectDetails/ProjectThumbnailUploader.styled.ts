import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  flex: 1;
  overflow: hidden;

  > input[type='file'] {
    display: none;
  }
`

export const ThumbnailSlot = styled.div`
  flex-shrink: 0;
  margin-bottom: 8px;
  cursor: pointer;
`

export const Overlay = styled.div`
  z-index: 100;
  position: absolute;
  inset: 0;
  border-radius: var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-lowest);

  display: flex;
  align-items: center;
  justify-content: center;
`

export const DropZone = styled.div`
  flex: 1;
  height: 100%;
  border-radius: var(--border-radius-l);

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--base-gap-large);
  border: 2px dashed transparent;

  user-select: none;
  opacity: 0.4;

  .icon {
    font-size: 40px;
  }

  &.active {
    border-color: var(--md-sys-color-outline);
    background-color: var(--md-sys-color-surface-container-lowest-hover);
    opacity: 1;
  }
`

export const CancelButton = styled(Button)`
  position: absolute;
  top: 4px;
  right: 4px;
`

export const UploadingProgress = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--base-gap-large);
  position: relative;
  width: 50%;

  .label {
    color: var(--md-sys-color-outline);
    top: 12px;
    position: relative;
  }
`

export const Progress = styled.div`
  height: 8px;
  position: absolute;
  border-radius: 4px;
  left: 0;
  background-color: var(--md-sys-color-primary);
  transition: right 0.2s;
`