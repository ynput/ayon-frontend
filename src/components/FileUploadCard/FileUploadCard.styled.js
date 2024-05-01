import styled from 'styled-components'

export const File = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);
  z-index: 0;

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

  /* set download default color outline when isImage */
  &.isImage {
    .download,
    .download-icon {
      color: var(--md-sys-color-outline);
    }
  }

  &.isDownloadable {
    cursor: pointer;

    /* if it's downloadable show download bar on hover */
    &:hover {
      footer {
        cursor: pointer;

        /* highlight download bar on hovering the bar */
        &:hover {
          background-color: var(--md-sys-color-surface-container-low-hover);

          .download,
          .download-icon {
            color: var(--md-sys-color-on-surface);
          }
        }
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

    &.isImage {
      &:hover {
        footer {
          padding: var(--padding-s);
        }
      }
    }

    /* when not an image, hover both */
    &:not(.isImage):hover {
      .image-wrapper,
      footer {
        background-color: var(--md-sys-color-surface-container-low-hover);

        .download-icon {
          display: none;
        }
      }

      .image-wrapper {
        .type-icon {
          display: none;
        }

        .download-icon {
          display: block;
        }
      }
    }
  }
`

export const Footer = styled.footer`
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 var(--padding-s);
  overflow: hidden;
  color: var(--md-sys-color-on-surface);

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
`

export const ImageWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--md-sys-color-surface-container-lowest);

  flex: 1;

  img {
    position: absolute;
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    background-color: var(--md-sys-color-surface-container-lowest);
  }

  .icon {
    user-select: none;
  }

  .download-icon {
    display: none;
  }
`
