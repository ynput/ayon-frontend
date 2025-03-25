import styled from 'styled-components'

export const File = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  z-index: 0;
  user-select: none;

  height: 105px;

  &.compact {
    height: 75px;
  }

  .icon {
    font-size: 30px;
  }

  .remove {
    position: absolute;
    top: 2px;
    right: 2px;
    padding: 2px;

    &:hover {
      background-color: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }

    .icon {
      font-size: 20px;
    }
  }

  /* move icon up slightly to center it */
  .type-icon {
    margin-top: -20px;
  }

  /* set download default color outline */
  .download,
  .download-icon {
    color: var(--md-sys-color-outline);
  }

  .expand-icon {
    pointer-events: none;
    position: absolute;
    /* center */
    left: 50%;
    bottom: calc(50% - 20px);
    transform: translate(-50%, -50%);

    display: none;
  }
`

export const Footer = styled.footer`
  background-color: var(--md-sys-color-surface-container-low);
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 var(--padding-s);
  overflow: hidden;
  color: var(--md-sys-color-on-surface);

  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  transition: padding 0.2s ease;

  span {
    font-size: 12px;
  }

  .name-wrapper {
    overflow: hidden;
  }

  .download {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    display: none;
    color: var(--md-sys-color-on-surface);
  }

  .name {
    position: relative;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    z-index: 20;
    display: inherit;
  }

  .extension {
    z-index: 20;
    min-width: fit-content;
    overflow: hidden;
  }

  .progress {
    position: absolute;
    inset: 0;
    background-color: var(--md-sys-color-primary-container);
    z-index: 10;

    transition: right 0.3s;

    display: none;
  }

  &.inProgress {
    .progress {
      display: block;
    }
  }

  .download-icon {
    font-size: 20px;
  }

  &.isDownloadable {
    &:hover {
      cursor: pointer;

      padding: var(--padding-m) var(--padding-s);

      background-color: var(--md-sys-color-surface-container-low-hover);

      .download,
      .download-icon {
        color: var(--md-sys-color-on-surface);
      }

      /* reveal size and download */
      .download {
        display: flex;
      }
      .name-wrapper,
      .extension {
        display: none;
      }
    }
  }
`

export const ContentWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--md-sys-color-surface-container-lowest);

  flex: 1;

  .icon {
    user-select: none;
  }

  .download-icon {
    display: none;
  }

  /* previewable styles (it can be expanded) */
  /* on hover it shows the expand icon */
  &.isPreviewable,
  &.isAnnotation {
    cursor: pointer;

    &:hover {
      .expand-icon {
        display: block;
      }
      .type-icon {
        display: none;
      }
    }
  }
`

export const ImageWrapper = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  background-color: var(--md-sys-color-surface-container-lowest);
  img {
    position: absolute;
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    height: calc(100% - 20px);

    transition: scale 0.2s ease;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--md-sys-color-surface-container-lowest);
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  &.isDownloadable {
    &:hover {
      &::after {
        opacity: 0.8;
      }

      .icon {
        display: block;
        z-index: 10;
      }
    }
  }
`
