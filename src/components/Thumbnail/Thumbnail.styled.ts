import styled from 'styled-components'
import getShimmerStyles from '../../styles/getShimmerStyles'

export const Card = styled.div`
  position: relative;
  width: 100%;
  height: 52px;
  aspect-ratio: 1.77;
  overflow: hidden;
  border-radius: var(--border-radius-l);
  margin: auto;
  border: solid 2px var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-lowest);

  transition: border-color 0.2s, background-color 0.2s;

  /* icon */
  .icon {
    position: absolute;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    inset: 0;
    color: var(--md-sys-color-outline);
    transition: opacity 0.2s;
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
      .icon {
        opacity: 1;
      }
    }
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      border-color: var(--md-sys-color-outline);

      background-color: var(--md-sys-color-surface-container-hover);
      &.loaded:not(.error) {
        background-color: var(--md-sys-color-on-surface);
      }

      img {
        scale: 1.1;
        opacity: 0.9;
      }
    }
  }

  &.shimmer {
    .icon {
      opacity: 0;
      animation: none;
    }

    border: none;
    border-color: transparent;
    background-color: unset;

    ${getShimmerStyles()}
  }
`

export const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--border-radius-m);
  overflow: hidden;

  /* ensures it always fills the parent */
  display: block;
  position: absolute;
  inset: 0;

  transition: scale 0.2s, opacity 0.2s;
`
