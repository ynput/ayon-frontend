import styled, { css } from 'styled-components'

export const Path = styled.div`
  position: relative;
  border-radius: var(--border-radius-m);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--base-gap-small);
  user-select: none;
  height: 100%;
  &,
  .icon {
    color: var(--md-sys-color-outline);
  }

  flex: 1;
`

export const SegmentWrapper = styled.div`
  position: relative;
`

export const Segment = styled.span`
  position: relative;
  padding: 0px 2px;
  border-radius: var(--border-radius-m);
  transition: color 0.2s, background-color 0.2s;
  min-width: max-content;

  display: flex;
  align-items: center;

  /* ... styles */
  &.more {
    cursor: pointer;

    padding: 0px 6px;
    &:hover {
      background-color: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
    }
  }
`

const NotClickableHover = css`
  background-color: var(--md-sys-color-surface-container);
  &,
  .icon {
    color: var(--md-sys-color-on-surface);
  }
`

export const ActiveSegment = styled.div`
  & > span,
  & > li {
    cursor: pointer;
    &:hover {
      ${NotClickableHover}
    }
  }

  &.open {
    & > span {
      ${NotClickableHover}
    }
  }

  &.link {
    & > span,
    & > li {
      &:hover {
        background-color: var(--md-sys-color-surface-container-highest-hover);
      }
    }
  }
`

export const MoreModal = styled.div`
  position: absolute;
  top: 100%;
  left: 0px;
  width: 100%;
  min-width: fit-content;

  z-index: 200;
  padding-top: 4px;
`

export const MoreList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);

  background-color: var(--md-sys-color-surface-container-high);
  border-radius: var(--border-radius-m);
  box-shadow: var(--md-sys-shadow-elevation-4);
  padding: var(--padding-s);

  margin: 0;
  list-style: none;

  max-height: 500px;
  overflow: auto;
`

export const MoreItem = styled.li`
  padding: var(--base-gap-small);
  border-radius: var(--border-radius-m);
  color: var(--md-sys-color-on-surface);
  min-width: max-content;
  width: 100%;
`
