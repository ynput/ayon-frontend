import { Button } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const DragAndDropWrapper = styled.div`
  height: 100%;

  > input[type='file'] {
    display: none;
  }

  /* hide input file type */
  input[type='file'] {
    display: none;
  }
`

export const DropZones = styled.div`
  z-index: 100;
  position: absolute;
  inset: 0;
  top: -40px; /* hack to get the dropzone to show over whole panel header */
  border-radius: var(--border-radius-l) var(--border-radius-l);
  background-color: var(--md-sys-color-surface-container-lowest);

  /* split the drop zones */
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

  /* hide children by default */
  opacity: 0.4;

  .icon {
    font-size: 40px;
  }

  /* when hovering over */
  &.active {
    border-color: var(--md-sys-color-outline);
    background-color: var(--md-sys-color-surface-container-lowest-hover);

    /* show children */
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
