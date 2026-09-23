import styled from 'styled-components'

export const Card = styled.div`
  position: relative;
  width: 100%;
  height: 52px;
  aspect-ratio: 1.7;
  overflow: hidden;
  margin: auto;

  background-color: var(--md-sys-color-surface-container-lowest);

  transition: border-color 0.2s, background-color 0.2s;

  &.border {
    border: solid 2px var(--md-sys-color-outline-variant);
  }

  /* icon */
  .icon {
    position: absolute;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    inset: 0;

    transition: opacity 0.2s;
  }

  .type-icon {
    color: var(--md-sys-color-outline);
  }

  .hover-icon {
    z-index: 1;
    font-size: 30px;
    color: var(--md-sys-color-on-surface);
  }

  /* dims the whole thumbnail behind the hover icon */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-color: var(--md-sys-color-surface-container-lowest);
    opacity: 0;
    transition: opacity 0.1s ease;
    pointer-events: none;
  }

  /* hide the image until it has been loaded */
  img,
  .icon {
    opacity: 0;
  }

  &.loaded {
    /* show img if not error otherwise show icon */
    &:not(.error) {
      img {
        opacity: 1;
      }
    }

    /* show icon if error */
    &.error {
      .type-icon {
        opacity: 1;
      }
    }
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      img {
        scale: 1.1;
      }

      /* show play icon */
      .hover-icon {
        opacity: 1;
      }

      &.hasHoverIcon::after {
        opacity: 0.8;
      }

      /* if :has a hover-icon hide the type-cion */
      .type-icon {
        opacity: 0;
      }
    }
  }

  &.loading {
    border: none;
    border-color: transparent;
  }
`

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  overflow: hidden;

  /* ensures it always fills the parent */
  display: block;
  position: absolute;
  inset: 0;

  transition: scale 0.2s, opacity 0.2s;
`
