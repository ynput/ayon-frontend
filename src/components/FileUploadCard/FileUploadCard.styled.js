import styled from 'styled-components'

export const File = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-low);

  height: 100px;

  &.compact {
    height: 92px;
  }

  footer {
    position: relative;
    padding: 0 var(--padding-s);
    overflow: hidden;
  }

  .name {
    position: relative;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    z-index: 20;
    display: inherit;
  }

  .progress {
    position: absolute;
    inset: 0;
    background-color: var(--md-sys-color-primary-container);
    z-index: 10;

    transition: right 0.3s;

    display: none;
  }

  .inProgress {
    .progress {
      display: block;
    }
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
`
