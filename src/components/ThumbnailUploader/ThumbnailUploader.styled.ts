import styled from 'styled-components'

export const ThumbnailUploaderWrapper = styled.div`
  position: absolute;
  inset: var(--padding-s);
  z-index: 900;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &.hidden {
    display: none;
  }

  .bg {
    position: absolute;
    inset: 0;
    border-radius: var(--md-sys-border-radius-m);
    border: 2px dashed var(--md-sys-color-outline);
    border-radius: var(--border-radius-l);
    background-color: var(--md-sys-color-surface-container-lowest);
  }

  &.isUploading {
    .bg {
      opacity: 1;
    }
    .icon.upload {
      display: none;
    }
  }

  &.isSuccess {
    .bg {
      opacity: 0;
    }
    .icon.upload {
      display: none;
    }
    &:hover {
      opacity: 0;
    }
  }
`

export const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  pointer-events: none;
  gap: var(--base-gap-large);

  .icon {
    user-select: none;
    pointer-events: none;
    background-color: unset;
    font-size: 3rem;

    transition: scale 0.2s, opacity 0.1s;
  }
`

export const Uploading = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;

  justify-content: center;
  align-items: center;
  gap: var(--base-gap-large);

  width: 100%;
  height: 100%;
  max-width: 200px;
  z-index: 10;

  img {
    height: 50%;
    object-fit: contain;
    width: 100%;
  }

  .progress-wrapper {
    position: relative;
    width: 100%;
    height: 8px;
  }
`

export const Progress = styled.div`
  position: absolute;
  border-radius: 4px;

  background-color: var(--md-sys-color-primary);

  inset: 0;

  transition: right 0.2s;
`
