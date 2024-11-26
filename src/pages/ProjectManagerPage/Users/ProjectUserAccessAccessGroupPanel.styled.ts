import styled from 'styled-components'

export const Wrapper = styled.div`
position: relative;
  justify-content: stretch;
  border-radius: 4px;
  &.dragged {
    opacity: 0;
  }
`

export const Header = styled.div`
  cursor: pointer;
  user-select: none;
  padding: 8px;
  font-size: 14px;
  line-height: 17px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);
  &:hover {
    background-color: var(--md-sys-color-surface-container-high-hover);
    .icon.toggle-expand {
      visibility: visible;
    }
  }
  .icon {
    width: 20px;
    height: 20px;
    &.draggable {
      cursor: grab;
    }
    &.toggle-expand {
      visibility: hidden;
    }
  }
  &.collapsed {
    color: red;
    height: 0;
  }
  &.expanded {
    background-color: var(--md-sys-color-surface-container-highest);
    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
    .icon.toggle-expand {
      visibility: visible;
    }
  }
  .spacer {
    flex-grow: 1;
  }
`

export const BodyExpander = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  overflow: hidden;
  // transition: grid-template-rows 0.25s;
  &.expanded {
    grid-template-rows: 1fr;
    min-height: 96px;
  }
`

export const Body = styled.div`
  background-color: var(--md-sys-color-surface-container-low);
  align-items: stretch;
  min-height: 0;
  transition: padding 0.25s;
`
